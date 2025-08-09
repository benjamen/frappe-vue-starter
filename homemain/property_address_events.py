import frappe, hashlib

def _fp(addr: str) -> str:
    return hashlib.sha1((addr or "").strip().lower().encode()).hexdigest()

def on_update_property(doc, method=None):
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
