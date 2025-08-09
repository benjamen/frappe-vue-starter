# homemain/doctype/property_estimate/property_estimate.py

import frappe
from frappe.model.document import Document

class PropertyEstimate(Document):
    def validate(self):
        # Auto-generate title if not set
        if not self.title and self.property and self.estimate_value_display:
            self.title = f"{self.property} - {self.estimate_value_display} ({self.estimate_date})"

        # Validate estimate range
        if self.range_min and self.range_max and self.range_min > self.range_max:
            frappe.throw("Range minimum cannot be greater than range maximum")

        # Validate estimate is within range
        if self.range_min and self.estimate_value < self.range_min:
            frappe.msgprint("Warning: Estimate value is below the stated minimum range")

        if self.range_max and self.estimate_value > self.range_max:
            frappe.msgprint("Warning: Estimate value is above the stated maximum range")

    def before_save(self):
        # Update market position based on suburb average
        if self.suburb_average and self.estimate_value:
            variance_threshold = 0.1  # 10%
            if self.estimate_value > self.suburb_average * (1 + variance_threshold):
                self.market_position = "Above Average"
            elif self.estimate_value < self.suburb_average * (1 - variance_threshold):
                self.market_position = "Below Average"
            else:
                self.market_position = "Average"

    def after_insert(self):
        # Update property with latest estimate
        if self.property and self.source == "Homes.co.nz":
            property_doc = frappe.get_doc("Property", self.property)
            property_doc.db_set("homes_estimate", self.estimate_value)

    @frappe.whitelist()
    def get_estimate_history(self):
        """Get estimate history for this property"""
        return frappe.get_all("Property Estimate",
            filters={"property": self.property},
            fields=["name", "estimate_date", "estimate_value", "source", "change_direction"],
            order_by="estimate_date desc"
        )

    @frappe.whitelist()
    def get_comparison_data(self):
        """Get comparison data for charts"""
        # Get other recent estimates for same property
        estimates = frappe.get_all("Property Estimate",
            filters={
                "property": self.property,
                "estimate_date": [">=", frappe.utils.add_months(self.estimate_date, -12)]
            },
            fields=["estimate_date", "estimate_value", "source"],
            order_by="estimate_date asc"
        )

        return {
            "estimates": estimates,
            "current": {
                "value": self.estimate_value,
                "date": self.estimate_date,
                "range_min": self.range_min,
                "range_max": self.range_max
            }
        }
