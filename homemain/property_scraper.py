# homemain/property_scraper.py

import frappe

# Import your actual scraper function and sync wrapper here
from homemain.property_council_scraper import get_property_info_sync

def scrape_and_update_home(docname):
    home = frappe.get_doc("Home", docname)
    try:
        # Mark as in progress
        home.db_set("scraper_status", "In Progress")
        home.db_set("scraper_message", "Scraping in progress...")

        # Do the scrape (this can take 10-30+ seconds)
        scraped = get_property_info_sync(home.address)
        if not scraped or not scraped.get("property_web_details"):
            home.db_set("scraper_status", "Failed")
            home.db_set("scraper_message", "No results found or scrape failed.")
            return

        web = scraped.get("property_web_details")
        # Map whatever fields you want (expand as you need)
        home.db_set("council_property_id", web.get("Property ID"))
        home.db_set("council_address", web.get("Address"))
        home.db_set("council_legal_description", web.get("Legal Description"))
        # (add more fields here...)

        # You could also save PDF info, images, etc. if needed

        home.db_set("scraper_status", "Success")
        home.db_set("scraper_message", "Scraped successfully!")
    except Exception as e:
        # On error, log and update status
        home.db_set("scraper_status", "Failed")
        home.db_set("scraper_message", f"Scraper failed: {e}")
        frappe.log_error(f"Home scraper error for {docname}: {e}", "homemain.property_scraper")

