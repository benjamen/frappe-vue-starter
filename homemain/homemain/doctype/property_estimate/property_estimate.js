// homemain/doctype/property_estimate/property_estimate.js

frappe.ui.form.on('Property Estimate', {
  refresh: function (frm) {
    // Add custom buttons
    if (!frm.doc.__islocal) {
      // Button to view property
      frm.add_custom_button(__('View Property'), function () {
        frappe.set_route('Form', 'Property', frm.doc.property);
      });

      // Button to show estimate history
      frm.add_custom_button(__('Estimate History'), function () {
        frm.call('get_estimate_history').then(r => {
          if (r.message && r.message.length) {
            show_estimate_history_dialog(r.message, frm.doc.property);
          } else {
            frappe.msgprint(__('No estimate history found'));
          }
        });
      }, __('View'));

      // Button to show comparison chart
      frm.add_custom_button(__('Value Chart'), function () {
        frm.call('get_comparison_data').then(r => {
          if (r.message) {
            show_value_chart(r.message, frm.doc.property);
          }
        });
      }, __('View'));
    }

    // Add indicators for change direction
    if (frm.doc.change_direction) {
      let color = 'blue';
      if (frm.doc.change_direction === 'Increase') {
        color = 'green';
      } else if (frm.doc.change_direction === 'Decrease') {
        color = 'red';
      }
      frm.dashboard.add_indicator(__('Trend: {0}', [frm.doc.change_direction]), color);
    }

    // Show market position indicator
    if (frm.doc.market_position) {
      let color = 'blue';
      if (frm.doc.market_position === 'Above Average') {
        color = 'green';
      } else if (frm.doc.market_position === 'Below Average') {
        color = 'orange';
      }
      frm.dashboard.add_indicator(__('Market: {0}', [frm.doc.market_position]), color);
    }
  },

  property: function (frm) {
    // Auto-fetch property address when property is selected
    if (frm.doc.property) {
      frappe.db.get_value('Property', frm.doc.property, 'address')
        .then(r => {
          if (r.message.address) {
            frm.set_value('property_address', r.message.address);
          }
        });
    }
  },

  estimate_value: function (frm) {
    // Auto-generate display format
    if (frm.doc.estimate_value) {
      let display_value = format_currency_display(frm.doc.estimate_value);
      frm.set_value('estimate_value_display', display_value);
    }
  }
});

function format_currency_display(value) {
  // Format large numbers as $840K, $1.2M etc
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '$' + Math.round(value / 1000) + 'K';
  } else {
    return '$' + value.toFixed(0);
  }
}

function show_estimate_history_dialog(history, property_name) {
  let dialog = new frappe.ui.Dialog({
    title: __('Estimate History for {0}', [property_name]),
    size: 'large',
    fields: [
      {
        fieldname: 'history_html',
        fieldtype: 'HTML'
      }
    ]
  });

  let html = '<table class="table table-bordered"><thead><tr>' +
    '<th>Date</th><th>Value</th><th>Source</th><th>Change</th></tr></thead><tbody>';

  history.forEach(est => {
    let change_class = '';
    if (est.change_direction === 'Increase') change_class = 'text-success';
    else if (est.change_direction === 'Decrease') change_class = 'text-danger';

    html += `<tr>
            <td>${est.estimate_date}</td>
            <td>${format_currency(est.estimate_value)}</td>
            <td>${est.source}</td>
            <td class="${change_class}">${est.change_direction}</td>
        </tr>`;
  });

  html += '</tbody></table>';
  dialog.fields_dict.history_html.$wrapper.html(html);
  dialog.show();
}

function show_value_chart(data, property_name) {
  // Simple chart showing value over time
  let dialog = new frappe.ui.Dialog({
    title: __('Value Chart for {0}', [property_name]),
    size: 'large',
    fields: [
      {
        fieldname: 'chart_html',
        fieldtype: 'HTML'
      }
    ]
  });

  // Create simple HTML chart (you could use a proper charting library)
  let chart_html = '<div style="height: 400px; padding: 20px;">';
  chart_html += '<h4>Property Value Estimates</h4>';

  if (data.estimates && data.estimates.length > 0) {
    chart_html += '<div class="alert alert-info">';
    chart_html += `Current Estimate: ${format_currency(data.current.value)} (${data.current.date})`;
    if (data.current.range_min && data.current.range_max) {
      chart_html += `<br>Range: ${format_currency(data.current.range_min)} - ${format_currency(data.current.range_max)}`;
    }
    chart_html += '</div>';

    chart_html += '<table class="table table-striped"><thead><tr><th>Date</th><th>Value</th><th>Source</th></tr></thead><tbody>';
    data.estimates.forEach(est => {
      chart_html += `<tr><td>${est.estimate_date}</td><td>${format_currency(est.estimate_value)}</td><td>${est.source}</td></tr>`;
    });
    chart_html += '</tbody></table>';
  } else {
    chart_html += '<p>No historical data available</p>';
  }

  chart_html += '</div>';
  dialog.fields_dict.chart_html.$wrapper.html(chart_html);
  dialog.show();
}
