import frappe
from frappe import _

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


@frappe.whitelist()
def update_user(doc):
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("You must be logged in to update your profile."))

    data = frappe._dict(frappe.parse_json(doc))
    doc = frappe.get_doc("User", user)

    for field in ["first_name", "last_name", "email", "mobile_no", "bio", "language", "time_zone"]:
        if field in data:
            doc.set(field, data[field])

    doc.save()
    return {
        "message": "Profile updated successfully",
        "user_image": doc.user_image
    }
