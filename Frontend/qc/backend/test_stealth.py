import os
import django
import json
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qcsystem.settings')
django.setup()

from django.db import connection

print("====== TESTING STEALTH OPERATIONS ======")
cursor = connection.cursor()

# 1. Clear previous test data
cursor.execute("DELETE FROM RawMaterialData WHERE [QC No.] LIKE 'TEST-%'")
cursor.execute("DELETE FROM AuditLogs WHERE EntityID LIKE 'TEST-%'")

# 2. Setup initial non-superuser row
cursor.execute("""
    INSERT INTO RawMaterialData (
        Date, [Material Name], [Material Code], [Material Category],
        [Batch No.], [QC No.], Micro, MicroStatus, Chemical, ChemicalStatus,
        Manufacturer, Supplier, [Manufacture Date], [Expiry Date], Status,
        Notes, [Created By], [Edited By], [Edited Date]
    ) VALUES (
        GETDATE(), 'Test Material 1', 'TM-01', 'Test Cat',
        'BAT-01', 'TEST-01', 0, 'Pending', 0, 'Pending',
        'Manuf', 'Supp', GETDATE(), GETDATE(), 'Pending',
        '', 'normaluser', NULL, NULL
    )
""")

# 3. Superuser Creation
print("\n--- Testing Creation Stealth ---")
from api.views import clean_datetime, clean_date
username = 'superuser'
actual_creator = username
if str(username).lower() == 'superuser':
    cursor.execute("SELECT TOP 1 [Created By] FROM RawMaterialData ORDER BY Date DESC, [QC No.] DESC")
    prev_creator_row = cursor.fetchone()
    if prev_creator_row and prev_creator_row[0]:
        actual_creator = prev_creator_row[0]
    else:
        actual_creator = 'System'

cursor.execute("""
    INSERT INTO RawMaterialData (
        Date, [Material Name], [Material Code], [Material Category],
        [Batch No.], [QC No.], Micro, MicroStatus, Chemical, ChemicalStatus,
        Manufacturer, Supplier, [Manufacture Date], [Expiry Date], Status,
        Notes, [Created By]
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", [
    date.today().isoformat(), 'Test Material 2', 'TM-02',
    '', 'BAT-02', 'TEST-02',
    False, 'Pending',
    False, 'Pending',
    '', '',
    date.today().isoformat(), date.today().isoformat(),
    'Pending', '', actual_creator
])

cursor.execute("SELECT [Created By] FROM RawMaterialData WHERE [QC No.] = 'TEST-02'")
row = cursor.fetchone()
creator = row[0] if row else 'None'
print(f"[{'PASS' if creator == 'normaluser' else 'FAIL'}] Superuser creation set Creator to: {creator}")

# 4. Superuser Extradata Edit (Stealth update with no previous edit)
print("\n--- Testing Edit Stealth (No Previous Log) ---")
username = 'superuser'
is_superuser = (str(username).lower() == 'superuser')
today = date.today().isoformat()
qc_no = 'TEST-02'

update_cols = """
    Date=%s, [Material Name]=%s, [Material Code]=%s,
    [Material Category]=%s, [Batch No.]=%s, [QC No.]=%s,
    Micro=%s, MicroStatus=%s, Chemical=%s, ChemicalStatus=%s,
    Manufacturer=%s, Supplier=%s,
    [Manufacture Date]=%s, [Expiry Date]=%s, Status=%s,
    Notes=%s
"""
update_params = [
    date.today().isoformat(), 'Test Material 2 - EDIT', 'TM-02',
    '', 'BAT-02', 'TEST-02',
    False, 'Pending',
    False, 'Pending',
    '', '',
    date.today().isoformat(), date.today().isoformat(),
    'Pending', ''
]

if not is_superuser:
    update_cols += ", [Edited By]=%s, [Edited Date]=%s"
    update_params.extend([username, today])

update_params.append(qc_no)

cursor.execute(f"UPDATE RawMaterialData SET {update_cols} WHERE [QC No.] = %s", update_params)

cursor.execute("SELECT [Edited By], [Material Name] FROM RawMaterialData WHERE [QC No.] = 'TEST-02'")
row3 = cursor.fetchone()
edited_by = row3[0] if row3 else 'MISSING'
mat_name = row3[1] if row3 else 'MISSING'
print(f"[{'PASS' if edited_by is None else 'FAIL'}] Edit kept Edited By empty: {edited_by}")
print(f"[{'PASS' if mat_name == 'Test Material 2 - EDIT' else 'FAIL'}] Material name updated: {mat_name}")

# Commit changes (optional since we might rollback or clear, but good practice for testing if we check via API)
connection.commit()
cursor.close()
