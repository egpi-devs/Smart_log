from django.urls import path
from . import views

urlpatterns = [
    # welcome
    path('welcome/', views.welcome, name='welcome'),
    # Auth
    path('auth/login/', views.login, name='login'),
    path('auth/forgot-password/', views.forgot_password, name='forgot_password'),

    # Raw Materials
    path('raw-materials/', views.raw_materials, name='raw_materials'),
    path('raw-materials/search/', views.raw_materials_search, name='raw_materials_search'),
    path('raw-materials/generate-qc/', views.raw_material_generate_qc, name='raw_material_generate_qc'),
    path('raw-materials/<str:qc_no>/', views.raw_material_detail, name='raw_material_detail'),

    # Packaging Materials
    path('packaging-materials/', views.packaging_materials, name='packaging_materials'),
    path('packaging-materials/search/', views.packaging_materials_search, name='packaging_materials_search'),
    path('packaging-materials/generate-qc/', views.packaging_material_generate_qc, name='packaging_material_generate_qc'),
    path('packaging-materials/<str:qc_no>/', views.packaging_material_detail, name='packaging_material_detail'),

    # Finished Products
    path('finished-products/', views.finished_products, name='finished_products'),
    path('finished-products/search/', views.finished_products_search, name='finished_products_search'),
    path('finished-products/generate-qc/', views.finished_product_generate_qc, name='finished_product_generate_qc'),
    path('finished-products/<str:qc_no>/', views.finished_product_detail, name='finished_product_detail'),
    path('finished-products/<str:qc_no>/mark-reviewed/', views.finished_product_mark_reviewed, name='finished_product_mark_reviewed'),

    # Products (Material Management)
    path('products/', views.products, name='products'),
    path('products/<int:product_id>/', views.product_detail, name='product_detail'),

    # Users
    path('users/', views.users, name='users'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),

    # Audit Trail
    path('audit-trail/', views.audit_trail, name='audit_trail'),
    path('production-audit-trail/', views.production_audit_trail, name='production_audit_trail'),

    # Yearly Reports
    path('yearly-reports/<str:category>/', views.yearly_report, name='yearly_report'),

    # Product Names (for dropdowns)
    path('product-names/', views.product_names_by_category, name='product_names'),

    # Server time (for pre-filling entry forms)
    path('server-time/', views.server_time, name='server_time'),

    # Admin helpers
    path('admin/drop-username-constraint/', views.drop_username_unique_constraint,
         name='drop_username_unique_constraint'),

    # Production Audit
    path('production/machines/', views.production_machines, name='production_machines'),
    path('production/sections/', views.production_sections, name='production_sections'),
    path('production/cleaning/', views.cleaning_logbooks, name='cleaning_logbooks'),
    path('production/cleaning/<int:log_id>/', views.cleaning_logbook_detail, name='cleaning_logbook_detail'),
    path('production/operation/', views.operation_logbooks, name='operation_logbooks'),
    path('production/operation/<int:log_id>/', views.operation_logbook_detail, name='operation_logbook_detail'),

    # Production Products
    path('production/products/', views.production_products, name='production_products'),
    path('production/products/<int:product_id>/', views.production_product_detail, name='production_product_detail'),
]
