from django.db import models


class Users(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)
    username = models.CharField(db_column='Username', max_length=255, unique=True)
    password = models.CharField(db_column='Password', max_length=255)
    role = models.CharField(db_column='Role', max_length=100)

    class Meta:
        managed = False
        db_table = 'Users'


class UserExtraRoles(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255)
    extra_role = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'user_extra_roles'


class ProductNames(models.Model):
    product_id = models.AutoField(db_column='ProductID', primary_key=True)
    product_name = models.CharField(db_column='ProductName', max_length=255)
    product_category = models.CharField(db_column='ProductCategory', max_length=100)

    class Meta:
        managed = False
        db_table = 'ProductNames'


class RawMaterialData(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateTimeField(db_column='Date', null=True)
    material_name = models.CharField(db_column='Material Name', max_length=255, null=True)
    material_code = models.CharField(db_column='Material Code', max_length=100, null=True)
    material_category = models.CharField(db_column='Material Category', max_length=100, null=True)
    batch_no = models.CharField(db_column='Batch No.', max_length=100, null=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, unique=True, null=True)
    micro = models.BooleanField(db_column='Micro', default=False)
    chemical = models.BooleanField(db_column='Chemical', default=False)
    manufacturer = models.CharField(db_column='Manufacturer', max_length=255, null=True)
    supplier = models.CharField(db_column='Supplier', max_length=255, null=True)
    manufacture_date = models.CharField(db_column='Manufacture Date', max_length=50, null=True)
    expiry_date = models.CharField(db_column='Expiry Date', max_length=50, null=True)
    status = models.CharField(db_column='Status', max_length=50, null=True)
    notes = models.TextField(db_column='Notes', null=True, blank=True)
    created_by = models.CharField(db_column='Created By', max_length=255, null=True)
    edited_by = models.CharField(db_column='Edited By', max_length=255, null=True)
    edited_date = models.CharField(db_column='Edited Date', max_length=50, null=True)

    class Meta:
        managed = False
        db_table = 'RawMaterialData'


class RawMaterialCreation(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateTimeField(db_column='Date', null=True)
    material_name = models.CharField(db_column='Material Name', max_length=255, null=True)
    material_code = models.CharField(db_column='Material Code', max_length=100, null=True)
    material_category = models.CharField(db_column='Material Category', max_length=100, null=True)
    batch_no = models.CharField(db_column='Batch No.', max_length=100, null=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, null=True)
    micro = models.BooleanField(db_column='Micro', default=False)
    chemical = models.BooleanField(db_column='Chemical', default=False)
    manufacturer = models.CharField(db_column='Manufacturer', max_length=255, null=True)
    supplier = models.CharField(db_column='Supplier', max_length=255, null=True)
    manufacture_date = models.CharField(db_column='Manufacture Date', max_length=50, null=True)
    expiry_date = models.CharField(db_column='Expiry Date', max_length=50, null=True)
    status = models.CharField(db_column='Status', max_length=50, null=True)
    notes = models.TextField(db_column='Notes', null=True, blank=True)
    created_by = models.CharField(db_column='Created By', max_length=255, null=True)

    class Meta:
        managed = False
        db_table = 'RawMaterialCreation'


class RawMaterialEdits(models.Model):
    id = models.AutoField(primary_key=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, null=True)
    edited_by = models.CharField(db_column='Edited By', max_length=255, null=True)
    edited_date = models.DateTimeField(db_column='Edited Date', null=True)
    old_value = models.TextField(db_column='Old Value', null=True)
    new_value = models.TextField(db_column='New Value', null=True)

    class Meta:
        managed = False
        db_table = 'RawMaterialEdits'


class PackagingMaterialData(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateTimeField(db_column='Date', null=True)
    material_name = models.CharField(db_column='Material Name', max_length=255, null=True)
    material_code = models.CharField(db_column='Material Code', max_length=100, null=True)
    material_category = models.CharField(db_column='Material Category', max_length=100, null=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, unique=True, null=True)
    micro = models.BooleanField(db_column='Micro', default=False)
    chemical = models.BooleanField(db_column='Chemical', default=False)
    manufacturer = models.CharField(db_column='Manufacturer', max_length=255, null=True)
    supplier = models.CharField(db_column='Supplier', max_length=255, null=True)
    status = models.CharField(db_column='Status', max_length=50, null=True)
    notes = models.TextField(db_column='Notes', null=True, blank=True)
    created_by = models.CharField(db_column='Created By', max_length=255, null=True)
    edited_by = models.CharField(db_column='Edited By', max_length=255, null=True)
    edited_date = models.CharField(db_column='Edited Date', max_length=50, null=True)

    class Meta:
        managed = False
        db_table = 'PackagingMaterialData'


class PackagingMaterialCreation(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateTimeField(db_column='Date', null=True)
    material_name = models.CharField(db_column='Material Name', max_length=255, null=True)
    material_code = models.CharField(db_column='Material Code', max_length=100, null=True)
    material_category = models.CharField(db_column='Material Category', max_length=100, null=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, null=True)
    micro = models.BooleanField(db_column='Micro', default=False)
    chemical = models.BooleanField(db_column='Chemical', default=False)
    manufacturer = models.CharField(db_column='Manufacturer', max_length=255, null=True)
    supplier = models.CharField(db_column='Supplier', max_length=255, null=True)
    status = models.CharField(db_column='Status', max_length=50, null=True)
    notes = models.TextField(db_column='Notes', null=True, blank=True)
    created_by = models.CharField(db_column='Created By', max_length=255, null=True)

    class Meta:
        managed = False
        db_table = 'PackagingMaterialCreation'


class PackagingMaterialEdits(models.Model):
    id = models.AutoField(primary_key=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, null=True)
    edited_by = models.CharField(db_column='Edited By', max_length=255, null=True)
    edited_date = models.DateTimeField(db_column='Edited Date', null=True)
    old_value = models.TextField(db_column='Old Value', null=True)
    new_value = models.TextField(db_column='New Value', null=True)

    class Meta:
        managed = False
        db_table = 'PackagingMaterialEdits'


class FinishedProductData(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateTimeField(db_column='Date', null=True)
    material_name = models.CharField(db_column='Material Name', max_length=255, null=True)
    material_code = models.CharField(db_column='Material Code', max_length=100, null=True)
    material_category = models.CharField(db_column='Material Category', max_length=100, null=True)
    batch_no = models.CharField(db_column='Batch No.', max_length=100, null=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, unique=True, null=True)
    micro = models.BooleanField(db_column='Micro', default=False)
    micro_status = models.CharField(db_column='MicroStatus', max_length=50, null=True)
    chemical = models.BooleanField(db_column='Chemical', default=False)
    chemical_status = models.CharField(db_column='ChemicalStatus', max_length=50, null=True)
    manufacture_date = models.CharField(db_column='Manufacture Date', max_length=50, null=True)
    expiry_date = models.CharField(db_column='Expiry Date', max_length=50, null=True)
    status = models.CharField(db_column='Status', max_length=50, null=True)
    notes = models.TextField(db_column='Notes', null=True, blank=True)
    created_by = models.CharField(db_column='Created By', max_length=255, null=True)
    reviewed = models.BooleanField(db_column='Reviewed', default=False)
    reviewed_by = models.CharField(db_column='Reviewed By', max_length=255, null=True)
    reviewed_date = models.CharField(db_column='Reviewed Date', max_length=50, null=True)

    class Meta:
        managed = False
        db_table = 'FinishedProductData'


class FinishedProductEdits(models.Model):
    id = models.AutoField(primary_key=True)
    qc_no = models.CharField(db_column='QC No.', max_length=100, null=True)
    edited_by = models.CharField(db_column='Edited By', max_length=255, null=True)
    edited_date = models.DateTimeField(db_column='Edited Date', null=True)
    old_value = models.TextField(db_column='Old Value', null=True)
    new_value = models.TextField(db_column='New Value', null=True)

    class Meta:
        managed = False
        db_table = 'FinishedProductEdits'


class AuditTrail(models.Model):
    id = models.AutoField(primary_key=True)
    operation_type = models.CharField(db_column='OperationType', max_length=100, null=True)
    username = models.CharField(db_column='Username', max_length=255, null=True)
    operation_time = models.DateTimeField(db_column='OperationTime', null=True)
    affected_table = models.CharField(db_column='AffectedTable', max_length=255, null=True)
    affected_record_id = models.CharField(db_column='AffectedRecordID', max_length=255, null=True)
    old_value = models.TextField(db_column='OldValue', null=True)
    new_value = models.TextField(db_column='NewValue', null=True)

    class Meta:
        managed = False
        db_table = 'AuditTrail'


class ProductionMachine(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)
    name = models.CharField(db_column='Name', max_length=255, unique=True)

    class Meta:
        managed = False
        db_table = 'ProductionMachine'


class ProductionSection(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)
    name = models.CharField(db_column='Name', max_length=255, unique=True)

    class Meta:
        managed = False
        db_table = 'ProductionSection'


class CleaningLogbook(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)
    machine = models.CharField(db_column='Machine', max_length=255, null=True)
    section = models.CharField(db_column='Section', max_length=255, null=True)
    date = models.DateTimeField(db_column='Date', null=True)
    product_name = models.CharField(db_column='ProductName', max_length=255, null=True)
    batch_no = models.CharField(db_column='BatchNo', max_length=100, null=True)
    batch_size = models.CharField(db_column='BatchSize', max_length=100, null=True)
    time_start = models.CharField(db_column='TimeStart', max_length=50, null=True)
    time_end = models.CharField(db_column='TimeEnd', max_length=50, null=True)
    due_date = models.DateTimeField(db_column='DueDate', null=True)
    cleaning_reason = models.TextField(db_column='CleaningReason', null=True)
    done_by = models.CharField(db_column='DoneBy', max_length=255, null=True)
    checked_by = models.CharField(db_column='CheckedBy', max_length=255, null=True)

    class Meta:
        managed = False
        db_table = 'CleaningLogbook'


class OperationLogbook(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)
    machine = models.CharField(db_column='Machine', max_length=255, null=True)
    section = models.CharField(db_column='Section', max_length=255, null=True)
    date = models.DateTimeField(db_column='Date', null=True)
    product_name = models.CharField(db_column='ProductName', max_length=255, null=True)
    batch_no = models.CharField(db_column='BatchNo', max_length=100, null=True)
    batch_size = models.CharField(db_column='BatchSize', max_length=100, null=True)
    operation_start = models.CharField(db_column='OperationStart', max_length=50, null=True)
    operation_end = models.CharField(db_column='OperationEnd', max_length=50, null=True)
    incident_brief = models.TextField(db_column='IncidentBrief', null=True)
    incident_action = models.TextField(db_column='IncidentAction', null=True)
    done_by = models.CharField(db_column='DoneBy', max_length=255, null=True)
    checked_by = models.CharField(db_column='CheckedBy', max_length=255, null=True)

    class Meta:
        managed = False
        db_table = 'OperationLogbook'
