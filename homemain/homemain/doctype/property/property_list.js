// homemain/doctype/property/property_list.js

frappe.listview_settings['Property'] = {
  add_fields: [
    "scraper_status",
    "homes_estimate_value",
    "capital_value",
    "bedrooms",
    "council"
  ],

  get_indicator: function (doc) {
    if (doc.scraper_status === "Success") {
      return [__("Scraped"), "green", "scraper_status,=,Success"];
    } else if (doc.scraper_status && doc.scraper_status.includes("Progress")) {
      return [__("Scraping"), "orange", "scraper_status,like,%Progress%"];
    } else if (doc.scraper_status === "Failed") {
      return [__("Failed"), "red", "scraper_status,=,Failed"];
    } else if (doc.scraper_status === "Pending") {
      return [__("Pending"), "blue", "scraper_status,=,Pending"];
    }
  },

  formatters: {
    homes_estimate_value: function (value) {
      if (value && value !== 'N/A') {
        return `<span class="text-success">${value}</span>`;
      }
      return '<span class="text-muted">-</span>';
    },
    capital_value: function (value) {
      if (value) {
        return `<span class="text-info">${format_currency(value)}</span>`;
      }
      return '<span class="text-muted">-</span>';
    }
  },

  onload: function (listview) {
    // Add custom buttons to list view
    listview.page.add_action_item(__("Bulk Re-scrape"), function () {
      let selected = listview.get_checked_items();
      if (selected.length === 0) {
        frappe.msgprint(__("Please select properties to re-scrape"));
        return;
      }

      frappe.confirm(
        `Re-scrape ${selected.length} selected properties?`,
        function () {
          selected.forEach(function (item) {
            frappe.call({
              method: 'frappe.client.set_value',
              args: {
                'doctype': 'Property',
                'name': item.name,
                'fieldname': 'address_fp',
                'value': ''
              }
            });
          });

          frappe.show_alert({
            message: __('Re-scraping queued for selected properties'),
            indicator: 'green'
          });

          setTimeout(() => listview.refresh(), 1000);
        }
      );
    });

    // Add filter shortcuts
    listview.page.add_action_item(__("Show Scraped Only"), function () {
      listview.filter_area.add([
        ["Property", "scraper_status", "=", "Success"]
      ]);
    });
  }
};
