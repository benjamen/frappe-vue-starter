// homemain/doctype/property/property.js

frappe.ui.form.on('Property', {
  refresh: function (frm) {
    // Add custom buttons for related records
    if (!frm.doc.__islocal) {
      frm.add_custom_button(__('Sale Records'), function () {
        frappe.route_options = { "property": frm.doc.name };
        frappe.set_route("List", "Sale Record");
      }, __("View"));

      frm.add_custom_button(__('Valuations'), function () {
        frappe.route_options = { "property": frm.doc.name };
        frappe.set_route("List", "Valuation Record");
      }, __("View"));

      frm.add_custom_button(__('Rate History'), function () {
        frappe.route_options = { "property": frm.doc.name };
        frappe.set_route("List", "Rate Record");
      }, __("View"));

      frm.add_custom_button(__('Estimates'), function () {
        frappe.route_options = { "property": frm.doc.name };
        frappe.set_route("List", "Property Estimate");
      }, __("View"));
    }

    // Add scraping controls
    if (frm.doc.docstatus < 2) {
      frm.add_custom_button(__('Force Re-scrape'), function () {
        frappe.confirm(
          'This will re-scrape data from external sources. Continue?',
          function () {
            // Clear the address fingerprint to force re-scrape
            frappe.call({
              method: 'frappe.client.set_value',
              args: {
                'doctype': 'Property',
                'name': frm.doc.name,
                'fieldname': 'address_fp',
                'value': ''
              },
              callback: function (r) {
                if (!r.exc) {
                  frm.save().then(() => {
                    frappe.show_alert({
                      message: __('Scraping job queued successfully'),
                      indicator: 'green'
                    });
                  });
                }
              }
            });
          }
        );
      }, __("Actions"));
    }

    // Add quick create buttons for related records
    if (!frm.doc.__islocal) {
      frm.add_custom_button(__('New Sale Record'), function () {
        frappe.new_doc('Sale Record', {
          'property': frm.doc.name,
          'property_address': frm.doc.address
        });
      }, __("Create"));

      frm.add_custom_button(__('New Valuation'), function () {
        frappe.new_doc('Valuation Record', {
          'property': frm.doc.name,
          'property_address': frm.doc.address
        });
      }, __("Create"));
    }

    // Show scraping status indicator
    if (frm.doc.scraper_status) {
      let indicator_color = 'blue';
      if (frm.doc.scraper_status === 'Success') {
        indicator_color = 'green';
      } else if (frm.doc.scraper_status === 'Failed') {
        indicator_color = 'red';
      } else if (frm.doc.scraper_status.includes('Progress')) {
        indicator_color = 'orange';
      }

      frm.dashboard.add_indicator(__('Scraper: {0}', [frm.doc.scraper_status]), indicator_color);
    }

    // Auto-refresh form if scraping in progress
    if (frm.doc.scraper_status && frm.doc.scraper_status.includes('Progress')) {
      setTimeout(() => {
        if (!frm.is_dirty()) {
          frm.reload_doc();
        }
      }, 10000); // Refresh every 10 seconds
    }
  },

  address: function (frm) {
    // Show message when address changes
    if (frm.doc.address && !frm.doc.__islocal) {
      frappe.show_alert({
        message: __('Address changed. Property will be re-scraped on save.'),
        indicator: 'blue'
      });
    }
  },

  onload: function (frm) {
    // Set custom queries for linked fields if needed
    frm.set_query('council', function () {
      return {
        filters: {
          'is_active': 1
        }
      };
    });
  }
});

// Custom function to show property summary
function show_property_summary(frm) {
  let summary_html = `
        <div class="row">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5>${frm.doc.homes_estimate_value || 'N/A'}</h5>
                        <small class="text-muted">Current Estimate</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5>${frm.doc.capital_value || 'N/A'}</h5>
                        <small class="text-muted">Council Value</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5>${frm.doc.homes_last_sale_price || 'N/A'}</h5>
                        <small class="text-muted">Last Sale</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5>${frm.doc.total_rates || 'N/A'}</h5>
                        <small class="text-muted">Annual Rates</small>
                    </div>
                </div>
            </div>
        </div>
    `;

  return summary_html;
}
