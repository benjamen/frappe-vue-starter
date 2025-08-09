# homemain/jobs.py

import frappe
import hashlib

def scrape_then_apply(docname: str):
    """
    Main job function that scrapes property data and applies it to related DocTypes
    """
    logger = frappe.logger("homemain")
    try:
        # Update address fingerprint to prevent duplicate scraping
        prop = frappe.get_doc("Property", docname)
        addr = (prop.address or "").strip()
        if addr:
            fp = _fp(addr)
            prop.db_set("address_fp", fp, update_modified=False)

        # 1) Run both scrapers
        from homemain.property_council_scraper import scrape_and_update_property
        from homemain.property_homes_scraper import scrape_and_update_property_estimates

        # Council scraper
        scrape_and_update_property(docname)

        # Homes.co.nz scraper
        scrape_and_update_property_estimates(docname)

        # 2) Apply the scraped data to other DocTypes (if you have post_scrape module)
        try:
            from homemain.post_scrape import apply_if_ready
            prop = frappe.get_doc("Property", docname)  # Reload to get scraped data
            apply_if_ready(prop)    # idempotent
            prop.save()             # persist any changes and set applied fields
        except ImportError:
            # post_scrape module doesn't exist yet, skip this step
            logger.info(f"[ScrapeThenApply] post_scrape module not found, skipping apply step for {docname}")

        logger.info(f"[ScrapeThenApply] Completed for {docname}")
    except Exception as e:
        logger.error(f"[ScrapeThenApply] Failed for {docname}: {e}")
        # surface failure on the Property (non-fatal)
        try:
            frappe.db.set_value("Property", docname, {
                "scraper_status": "Failed",
                "scraper_message": f"Scrape/apply failed: {e}"
            })
        except Exception:
            pass
    finally:
        frappe.db.commit()

def _fp(addr: str) -> str:
    """Generate fingerprint hash for address comparison"""
    return hashlib.sha1((addr or "").strip().lower().encode()).hexdigest()

def on_update_property(doc, method=None):
    """
    Hook function to trigger scraping when property address changes.
    This should be called from Property DocType hooks.
    """
    addr = (doc.address or "").strip()
    if not addr:
        return

    fp = _fp(addr)

    # first time set or changed → queue the job
    if fp != (doc.get("address_fp") or ""):
        # store fingerprint without bumping modified
        doc.db_set("address_fp", fp, update_modified=False)

        # mark progress (optional)
        if doc.meta.has_field("scraper_status"):
            doc.db_set("scraper_status", "HomesScraper In Progress", update_modified=False)
            doc.db_set("scraper_message", "Scraping homes.co.nz in progress...", update_modified=False)

        frappe.enqueue(
            "homemain.jobs.scrape_then_apply",
            queue="long",
            job_name=f"ScrapeThenApply:{doc.name}",
            docname=doc.name
        )
