from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.login, name='login'),
    path('auth/forgot-password/', views.forgot_password, name='forgot_password'),

    # Raw Materials
    path('raw-materials/', views.raw_materials, name='raw_materials'),
    path('raw-materials/search/', views.raw_materials_search, name='raw_materials_search'),
    path('raw-materials/generate-qc/', views.raw_material_generate_qc, name='raw_material_generate_qc'),
    path('raw-materials/<str:qc_no>/', views.raw_material_detail, name='raw_material_detail'),
    path('raw-materials/<str:qc_no>/mark-micro/', views.raw_material_mark_micro, name='raw_material_mark_micro'),
    path('raw-materials/<str:qc_no>/mark-reviewed/', views.raw_material_mark_reviewed, name='raw_material_mark_reviewed'),

    # Packaging Materials
    path('packaging-materials/', views.packaging_materials, name='packaging_materials'),
    path('packaging-materials/search/', views.packaging_materials_search, name='packaging_materials_search'),
    path('packaging-materials/generate-qc/', views.packaging_material_generate_qc, name='packaging_material_generate_qc'),
    path('packaging-materials/<str:qc_no>/', views.packaging_material_detail, name='packaging_material_detail'),
    path('packaging-materials/<str:qc_no>/mark-micro/', views.pm_mark_micro, name='pm_mark_micro'),
    path('packaging-materials/<str:qc_no>/mark-reviewed/', views.pm_mark_reviewed, name='pm_mark_reviewed'),

    # Finished Products
    path('finished-products/', views.finished_products, name='finished_products'),
    path('finished-products/search/', views.finished_products_search, name='finished_products_search'),
    path('finished-products/generate-qc/', views.finished_product_generate_qc, name='finished_product_generate_qc'),
    path('finished-products/<str:qc_no>/', views.finished_product_detail, name='finished_product_detail'),
    path('finished-products/<str:qc_no>/mark-reviewed/', views.finished_product_mark_reviewed, name='finished_product_mark_reviewed'),
    path('finished-products/<str:qc_no>/mark-micro/', views.finished_product_mark_micro, name='finished_product_mark_micro'),

    # Products (Material Management)
    path('products/', views.products, name='products'),
    path('products/<int:product_id>/', views.product_detail, name='product_detail'),

    # Users
    path('users/', views.users, name='users'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),

    # Audit Trail
    path('audit-trail/', views.audit_trail, name='audit_trail'),

    # Yearly Reports
    path('yearly-reports/<str:category>/', views.yearly_report, name='yearly_report'),

    # Product Names (for dropdowns)
    path('product-names/', views.product_names_by_category, name='product_names'),

    # Server time (for pre-filling entry forms)
    path('server-time/', views.server_time, name='server_time'),

    # Export
    path('export/', views.export_data, name='export_data'),

    # Admin helpers
    path('admin/drop-username-constraint/', views.drop_username_unique_constraint,
         name='drop_username_unique_constraint'),
]
