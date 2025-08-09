# homemain/doctype/property/property.py
import frappe
from frappe.model.document import Document

class Property(Document):
    def after_insert(self):
        # Run after first insert
        self.enqueue_scrape()

    def validate(self):
        # Run on every save; only scrape if address changed
        if self.is_new() or self.has_value_changed("address"):
            self.enqueue_scrape()

    def enqueue_scrape(self):
        # Set status and message fields
        self.db_set("scraper_status", "Pending")
        self.db_set("scraper_message", "Queued for scraping")

        # Enqueue the unified scraping job that handles both scrapers
        frappe.enqueue(
            "homemain.jobs.scrape_then_apply",
            queue="long",
            job_name=f"ScrapeThenApply:{self.name}",
            docname=self.name
        )
