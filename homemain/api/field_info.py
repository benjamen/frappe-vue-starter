import frappe

@frappe.whitelist()
def get_doctype_fields(doctype):
    meta = frappe.get_meta(doctype)
    return [
        {
            "fieldname": df.fieldname,
            "label": df.label,
            "fieldtype": df.fieldtype
        }
        for df in meta.fields if df.fieldname
    ]
