KANYE SERIES ADMIN PAGES
=========================
Generated as a single-file-per-page admin portal.

Technology:
- HTML5
- Tailwind CSS
- Vanilla JavaScript ES Modules
- Firebase Authentication
- Firebase Realtime Database
- Cloudinary
- Bootstrap Icons
- SweetAlert2

No Firestore and no Firebase Storage are used.

ADMIN AUTHORIZATION
-------------------
Each admin page checks:
users/{UID}/role === "admin"

IMPORTANT:
Frontend checks are not sufficient. Configure Firebase Realtime Database Security Rules
to enforce admin access server-side.

CLOUDINARY
----------
Cloud name: garfgnqe
Unsigned upload preset: kanyeseries
Upload endpoint:
https://api.cloudinary.com/v1_1/garfgnqe/image/upload

ORDER PATH NOTE
---------------
The admin pages support the requested orders/{USER_UID}/{ORDER_ID} layout and also
attempt to handle a single-level order record where practical. Do not migrate or
invent production data without confirming the existing customer-site schema.

FILES
-----
admin-login.html
admin-index.html
admin-products.html
admin-add-product.html
admin-edit-product.html
admin-orders.html
admin-order-details.html
admin-users.html
admin-user-details.html
admin-categories.html
admin-special-orders.html
admin-wishlist.html
admin-cart.html
admin-sales.html
admin-settings.html
admin-profile.html
