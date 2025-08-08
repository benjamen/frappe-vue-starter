# homemain/doctype/home/home.py

import frappe
from frappe.model.document import Document

class Home(Document):
    def after_insert(self):
        # Run after first insert
        self.enqueue_scrape()   # ✅ Yes, good

    def validate(self):
        # Run on every save; only scrape if address changed
        if self.is_new() or self.has_value_changed("address"):
            self.enqueue_scrape()   # ✅ Yes, good

    def enqueue_scrape(self):
        # Set status and message fields (make sure these are in your DocType!)
        self.db_set("scraper_status", "Pending")
        self.db_set("scraper_message", "Queued for scraping")
        # Enqueue the background scraping job
        frappe.enqueue(
            "homemain.property_council_scraper.scrape_and_update_home",
            docname=self.name
        )
        frappe.enqueue(
            "homemain.property_homes_scraper.scrape_and_update_home_estimates",
            docname=self.name
        )
