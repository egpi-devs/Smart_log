import json
import bcrypt
import pyodbc
from datetime import datetime, date

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import connection

def welcome(request):
    return JsonResponse({"message": "Welcome API working"})

def clean_date(val):
    """Sanitize a date value for SQL Server: empty/falsy → None, strip 'T'."""
    if not val or not str(val).strip():
        return None
    return str(val).strip().replace('T', ' ')


def clean_datetime(val):
    """Alias for clean_date — works for both date and datetime columns."""
    return clean_date(val)


# ──────────────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────────────

def dictfetchall(cursor):
    """Return all rows from a cursor as a list of dicts."""
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def dictfetchone(cursor):
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(columns, row)) if row else None


def get_user_roles(cursor, username):
    """Get all roles for a user (primary + extra)."""
    cursor.execute(
        "SELECT Role FROM Users WHERE Username = %s",
        [username]
    )
    row = cursor.fetchone()
    roles = [row[0]] if row else []

    try:
        cursor.execute(
            "SELECT extra_role FROM user_extra_roles WHERE username = %s",
            [username]
        )
        for r in cursor.fetchall():
            if r[0] not in roles:
                roles.append(r[0])
    except Exception:
        pass  # Table might not exist yet

    return roles


def has_any_role(user_roles, *targets):
    return any(r in targets for r in user_roles)


def role_starts_with(user_roles, *prefixes):
    return any(r.startswith(p) for r in user_roles for p in prefixes)


def log_audit(cursor, username, action_type, entity_type, entity_id, old_values=None, new_values=None, details=None):
    """
    Unified logging helper for the new AuditLogs table.
    Old/New values should be JSON strings or None.
    """
    cursor.execute("""
        INSERT INTO AuditLogs (
            Timestamp, Username, ActionType, EntityType, EntityID, OldValues, NewValues, Details
        ) VALUES (GETDATE(), %s, %s, %s, %s, %s, %s, %s)
    """, [username, action_type, entity_type, entity_id, old_values, new_values, details])


def log_production_audit(cursor, username, action_type, entity_type, entity_id, old_values=None, new_values=None, details=None, custom_timestamp=None):
    """
    Isolated logging helper for Production Audit Logs.
    """
    cursor.execute("""
        INSERT INTO ProductionAuditLogs (
            Timestamp, Username, ActionType, EntityType, EntityID, OldValues, NewValues, Details
        ) VALUES (COALESCE(%s, GETDATE()), %s, %s, %s, %s, %s, %s, %s)
    """, [custom_timestamp, username, action_type, entity_type, entity_id, old_values, new_values, details])


# ──────────────────────────────────────────────
#  AUTH VIEWS
# ──────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response({'error': 'Username and password required'},
                        status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        cursor.execute("SELECT ID, Password FROM Users WHERE Username = %s", [username])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'User not found'},
                            status=status.HTTP_401_UNAUTHORIZED)

        user_id = row[0]
        stored_hash = row[1]
        if not bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            return Response({'error': 'Invalid password'},
                            status=status.HTTP_401_UNAUTHORIZED)

        roles = get_user_roles(cursor, username)
        log_audit(
            cursor=cursor,
            username=username,
            action_type='Login',
            entity_type='User',
            entity_id=username,
            details='User logged in'
        )

    # Generate JWT tokens
    from rest_framework_simplejwt.tokens import RefreshToken

    class FakeUser:
        pk = user_id
        id = user_id

    fake = FakeUser()
    refresh = RefreshToken.for_user(fake)
    refresh['username'] = username
    refresh['roles'] = roles

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': username,
        'roles': roles,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    username = request.data.get('username', '').strip()
    new_password = request.data.get('new_password', '').strip()
    confirm_password = request.data.get('confirm_password', '').strip()
    admin_username = request.data.get('admin_username', '').strip()
    admin_password = request.data.get('admin_password', '').strip()

    if not all([username, new_password, confirm_password, admin_username, admin_password]):
        return Response({'error': 'All fields are required'}, status=400)

    if new_password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=400)

    with connection.cursor() as cursor:
        # Validate admin — Manager or Production Manager can reset passwords
        cursor.execute(
            "SELECT Password FROM Users WHERE Username = %s AND Role IN ('Manager', 'Production Manager')",
            [admin_username]
        )
        admin_row = cursor.fetchone()
        if not admin_row:
            return Response({'error': 'Invalid admin credentials'}, status=403)

        if not bcrypt.checkpw(admin_password.encode('utf-8'),
                              admin_row[0].encode('utf-8')):
            return Response({'error': 'Invalid admin credentials'}, status=403)

        # Check user exists
        cursor.execute("SELECT COUNT(*) FROM Users WHERE Username = %s", [username])
        if cursor.fetchone()[0] == 0:
            return Response({'error': 'Username does not exist'}, status=404)

        # Update password
        hashed = bcrypt.hashpw(new_password.encode('utf-8'),
                               bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE Users SET Password = %s WHERE Username = %s",
                       [hashed, username])

    return Response({'message': 'Password reset successfully'})


# ──────────────────────────────────────────────
#  RAW MATERIALS
# ──────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def raw_materials(request):
    current_year = datetime.now().strftime('%y')
    qc_pattern = f'%{current_year}RM'

    if request.method == 'GET':
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 30))

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM RawMaterialData WHERE [QC No.] LIKE %s",
                [qc_pattern]
            )
            total = cursor.fetchone()[0]

            cursor.execute("""
                SELECT r.Date, r.[Material Name], r.[Material Code],
                       p.[ProductCategory], r.[Batch No.], r.[QC No.],
                       r.Micro, r.Chemical, r.Manufacturer, r.Supplier,
                       r.[Manufacture Date], r.[Expiry Date], r.Status,
                       r.Notes, r.[Created By], r.[Edited By], r.[Edited Date]
                FROM RawMaterialData r
                JOIN ProductNames p ON r.[Material Name] = p.[ProductName]
                WHERE r.[QC No.] LIKE %s
                ORDER BY r.[QC No.] DESC
                OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
            """, [qc_pattern, offset, limit])
            rows = dictfetchall(cursor)

        return Response({'total': total, 'results': rows})

    elif request.method == 'POST':
        data = request.data
        username = data.get('username', 'Unknown')
        user_roles = data.get('user_roles', [])

        rm_heads = {'Section Head (RM)', 'Manager', 'Superuser'}
        if not has_any_role(user_roles, *rm_heads):
            data['status'] = 'Pending'

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO RawMaterialData (
                    Date, [Material Name], [Material Code], [Material Category],
                    [Batch No.], [QC No.], Micro, Chemical, Manufacturer,
                    Supplier, [Manufacture Date], [Expiry Date], Status,
                    Notes, [Created By]
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                clean_datetime(data['date']), data['material'], data['material_code'],
                data['category'], data['batch'], data['qc'],
                data.get('micro', False), data.get('chemical', False),
                data.get('manufacturer', ''), data.get('supplier', ''),
                clean_date(data.get('manufacture_date')), clean_date(data.get('expiry_date')),
                data.get('status', 'Pending'), data.get('notes', ''), username
            ])

            # Also insert into unified audit log
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Creation',
                entity_type='Raw Material',
                entity_id=data['qc'],
                details=f"Status: {data.get('status', 'Pending')}"
            )

        return Response({'message': 'Entry added successfully'}, status=201)


@api_view(['PUT'])
@permission_classes([AllowAny])
def raw_material_detail(request, qc_no):
    data = request.data
    username = data.get('username', 'Unknown')
    user_roles = data.get('user_roles', [])
    today = date.today().isoformat()

    rm_heads = {'Section Head (RM)', 'Manager', 'Superuser'}
    if not has_any_role(user_roles, *rm_heads):
        data['status'] = 'Pending'

    with connection.cursor() as cursor:
        # Get old data for audit
        cursor.execute("""
            SELECT Date, [Material Name], [Material Code], [Material Category],
                   [Batch No.], [QC No.], Micro, Chemical, Manufacturer,
                   Supplier, [Manufacture Date], [Expiry Date], Status, Notes
            FROM RawMaterialData WHERE [QC No.] = %s
        """, [qc_no])
        old_row = cursor.fetchone()
        if not old_row:
            return Response({'error': 'Record not found'}, status=404)

        old_data = {
            'date': str(old_row[0]), 'material': old_row[1],
            'material_code': old_row[2], 'category': old_row[3],
            'batch': old_row[4], 'qc': old_row[5],
            'micro': old_row[6], 'chemical': old_row[7],
            'manufacturer': old_row[8] or '', 'supplier': old_row[9] or '',
            'manufacture_date': str(old_row[10] or ''), 'expiry_date': str(old_row[11] or ''),
            'status': old_row[12], 'notes': old_row[13] or ''
        }

        # Use incoming value if supplied; fall back to existing DB value
        new_mfg  = clean_date(data.get('manufacture_date')) if data.get('manufacture_date') else old_row[10]
        new_exp  = clean_date(data.get('expiry_date'))      if data.get('expiry_date')      else old_row[11]

        # Find changes
        changes = {}
        compare_data = {
            **data,
            'manufacture_date': new_mfg or '',
            'expiry_date': new_exp or '',
            'micro': data.get('micro', False),
            'chemical': data.get('chemical', False),
            'manufacturer': data.get('manufacturer', ''),
            'supplier': data.get('supplier', ''),
            'status': data.get('status', 'Pending'),
            'notes': data.get('notes', '')
        }
        for key in old_data:
            if key in compare_data and str(compare_data[key]) != str(old_data[key]):
                changes[key] = {'old': str(old_data[key]), 'new': str(compare_data[key])}

        cursor.execute("""
            UPDATE RawMaterialData
            SET Date=%s, [Material Name]=%s, [Material Code]=%s,
                [Material Category]=%s, [Batch No.]=%s, [QC No.]=%s,
                Micro=%s, Chemical=%s, Manufacturer=%s, Supplier=%s,
                [Manufacture Date]=%s, [Expiry Date]=%s, Status=%s,
                Notes=%s, [Edited By]=%s, [Edited Date]=%s
            WHERE [QC No.] = %s
        """, [
            clean_datetime(data['date']), data['material'], data['material_code'],
            data['category'], data['batch'], data['qc'],
            data.get('micro', False), data.get('chemical', False),
            data.get('manufacturer', ''), data.get('supplier', ''),
            new_mfg, new_exp,
            data.get('status', 'Pending'), data.get('notes', ''),
            username, today, qc_no
        ])

        if changes:
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Edit',
                entity_type='Raw Material',
                entity_id=qc_no,
                old_values=json.dumps({k: v['old'] for k, v in changes.items()}),
                new_values=json.dumps({k: v['new'] for k, v in changes.items()})
            )

    return Response({'message': 'Entry updated successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def raw_materials_search(request):
    data = request.data
    current_year = datetime.now().strftime('%y')

    query = """
        SELECT r.Date, r.[Material Name], r.[Material Code],
               p.[ProductCategory], r.[Batch No.], r.[QC No.],
               r.Micro, r.Chemical, r.Manufacturer, r.Supplier,
               r.[Manufacture Date], r.[Expiry Date], r.Status,
               r.Notes, r.[Created By], r.[Edited By], r.[Edited Date]
        FROM RawMaterialData r
        JOIN ProductNames p ON r.[Material Name] = p.[ProductName]
        WHERE 1=1
    """
    params = []

    year_filter = data.get('year_filter', current_year)
    query += " AND r.[QC No.] LIKE %s"
    params.append(f'%{year_filter}RM')

    for field, col in [
        ('material_name', "r.[Material Name]"),
        ('batch_number', "r.[Batch No.]"),
        ('qc_number', "r.[QC No.]"),
        ('material_code', "r.[Material Code]"),
        ('manufacturer', "r.Manufacturer"),
        ('supplier', "r.Supplier"),
        ('status', "r.Status"),
        ('notes', "r.Notes"),
    ]:
        val = data.get(field, '').strip()
        if val:
            query += f" AND {col} LIKE %s"
            params.append(f'%{val}%')

    if data.get('product_category'):
        query += " AND p.[ProductCategory] LIKE %s"
        params.append(f'%{data["product_category"]}%')

    if data.get('from_date'):
        query += " AND r.Date >= %s"
        params.append(data['from_date'])
    if data.get('to_date'):
        query += " AND r.Date <= %s"
        params.append(data['to_date'])

    query += " ORDER BY r.[QC No.] DESC"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = dictfetchall(cursor)

    return Response({'results': rows, 'total': len(rows)})


@api_view(['GET'])
@permission_classes([AllowAny])
def raw_material_generate_qc(request):
    """Generate next QC number for raw materials."""
    current_year = datetime.now().strftime('%y')
    category_code = 'RM'

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT TOP 1 [QC No.]
            FROM RawMaterialData
            WHERE [Material Category] = 'Raw'
            AND [QC No.] LIKE %s
            ORDER BY [QC No.] DESC
        """, [f'%\\{current_year}{category_code}'])

        latest = cursor.fetchone()

        if latest and latest[0]:
            try:
                qc_str = latest[0]
                seq_part = qc_str.split('\\')[0]
                seq_num = int(seq_part.split('-')[0])
                new_num = f'{seq_num + 1:04d}'
            except (IndexError, ValueError):
                new_num = '0001'
        else:
            new_num = '0001'

        qc_number = f'{new_num}-00\\{current_year}{category_code}'

        # Ensure uniqueness
        cursor.execute(
            "SELECT COUNT(*) FROM RawMaterialData WHERE [QC No.] = %s",
            [qc_number]
        )
        while cursor.fetchone()[0] > 0:
            seq_num = int(new_num)
            new_num = f'{seq_num + 1:04d}'
            qc_number = f'{new_num}-00\\{current_year}{category_code}'
            cursor.execute(
                "SELECT COUNT(*) FROM RawMaterialData WHERE [QC No.] = %s",
                [qc_number]
            )

    return Response({'qc_number': qc_number})


# ──────────────────────────────────────────────
#  PACKAGING MATERIALS
# ──────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def packaging_materials(request):
    current_year = datetime.now().strftime('%y')
    qc_pattern = f'%{current_year}PM'

    if request.method == 'GET':
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 30))

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM PackagingMaterialData WHERE [QC No.] LIKE %s",
                [qc_pattern]
            )
            total = cursor.fetchone()[0]

            cursor.execute("""
                SELECT r.Date, r.[Material Name], r.[Material Code],
                       p.[ProductCategory], r.[QC No.],
                       r.Micro, r.Chemical, r.Manufacturer, r.Supplier,
                       r.Status, r.Notes, r.[Created By],
                       r.[Edited By], r.[Edited Date]
                FROM PackagingMaterialData r
                JOIN ProductNames p ON r.[Material Name] = p.[ProductName]
                WHERE r.[QC No.] LIKE %s
                ORDER BY r.[QC No.] DESC
                OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
            """, [qc_pattern, offset, limit])
            rows = dictfetchall(cursor)

        return Response({'total': total, 'results': rows})

    elif request.method == 'POST':
        data = request.data
        username = data.get('username', 'Unknown')
        user_roles = data.get('user_roles', [])

        pm_heads = {'Section Head (PM)', 'Manager', 'Superuser'}
        if not has_any_role(user_roles, *pm_heads):
            data['status'] = 'Pending'

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO PackagingMaterialData (
                    Date, [Material Name], [Material Code], [Material Category],
                    [QC No.], Micro, Chemical, Manufacturer, Supplier,
                    Status, Notes, [Created By]
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                clean_datetime(data['date']), data['material'], data['material_code'],
                data['category'], data['qc'],
                data.get('micro', False), data.get('chemical', False),
                data.get('manufacturer', ''), data.get('supplier', ''),
                data.get('status', 'Pending'), data.get('notes', ''), username
            ])

            # Also insert into unified audit log
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Creation',
                entity_type='Packaging Material',
                entity_id=data['qc'],
                details=f"Status: {data.get('status', 'Pending')}"
            )

        return Response({'message': 'Entry added successfully'}, status=201)


@api_view(['PUT'])
@permission_classes([AllowAny])
def packaging_material_detail(request, qc_no):
    data = request.data
    username = data.get('username', 'Unknown')
    user_roles = data.get('user_roles', [])
    today = date.today().isoformat()

    pm_heads = {'Section Head (PM)', 'Manager', 'Superuser'}
    if not has_any_role(user_roles, *pm_heads):
        data['status'] = 'Pending'

    with connection.cursor() as cursor:
        # Get old data for audit
        cursor.execute("""
            SELECT Date, [Material Name], [Material Code], [Material Category],
                   [QC No.], Micro, Chemical, Manufacturer, Supplier,
                   Status, Notes
            FROM PackagingMaterialData WHERE [QC No.] = %s
        """, [qc_no])
        old_row = cursor.fetchone()
        if not old_row:
            return Response({'error': 'Record not found'}, status=404)

        old_data = {
            'date': str(old_row[0]), 'material': old_row[1],
            'material_code': old_row[2], 'category': old_row[3],
            'qc': old_row[4], 'micro': old_row[5], 'chemical': old_row[6],
            'manufacturer': old_row[7] or '', 'supplier': old_row[8] or '',
            'status': old_row[9], 'notes': old_row[10] or ''
        }

        # Find changes
        changes = {}
        compare_data = {
            **data,
            'micro': data.get('micro', False),
            'chemical': data.get('chemical', False),
            'manufacturer': data.get('manufacturer', ''),
            'supplier': data.get('supplier', ''),
            'status': data.get('status', 'Pending'),
            'notes': data.get('notes', '')
        }
        for key in old_data:
            if key in compare_data and str(compare_data[key]) != str(old_data[key]):
                changes[key] = {'old': str(old_data[key]), 'new': str(compare_data[key])}

        cursor.execute("""
            UPDATE PackagingMaterialData
            SET Date=%s, [Material Name]=%s, [Material Code]=%s,
                [Material Category]=%s, [QC No.]=%s,
                Micro=%s, Chemical=%s, Manufacturer=%s, Supplier=%s,
                Status=%s, Notes=%s, [Edited By]=%s, [Edited Date]=%s
            WHERE [QC No.] = %s
        """, [
            clean_datetime(data['date']), data['material'], data['material_code'],
            data['category'], data['qc'],
            data.get('micro', False), data.get('chemical', False),
            data.get('manufacturer', ''), data.get('supplier', ''),
            data.get('status', 'Pending'), data.get('notes', ''),
            username, today, qc_no
        ])

        if changes:
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Edit',
                entity_type='Packaging Material',
                entity_id=qc_no,
                old_values=json.dumps({k: v['old'] for k, v in changes.items()}),
                new_values=json.dumps({k: v['new'] for k, v in changes.items()})
            )

    return Response({'message': 'Entry updated successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def packaging_materials_search(request):
    data = request.data
    current_year = datetime.now().strftime('%y')

    query = """
        SELECT r.Date, r.[Material Name], r.[Material Code],
               p.[ProductCategory], r.[QC No.],
               r.Micro, r.Chemical, r.Manufacturer, r.Supplier,
               r.Status, r.Notes, r.[Created By],
               r.[Edited By], r.[Edited Date]
        FROM PackagingMaterialData r
        JOIN ProductNames p ON r.[Material Name] = p.[ProductName]
        WHERE 1=1
    """
    params = []

    year_filter = data.get('year_filter', current_year)
    query += " AND r.[QC No.] LIKE %s"
    params.append(f'%{year_filter}PM')

    for field, col in [
        ('material_name', "r.[Material Name]"),
        ('qc_number', "r.[QC No.]"),
        ('material_code', "r.[Material Code]"),
        ('manufacturer', "r.Manufacturer"),
        ('supplier', "r.Supplier"),
        ('status', "r.Status"),
        ('notes', "r.Notes"),
    ]:
        val = data.get(field, '').strip()
        if val:
            query += f" AND {col} LIKE %s"
            params.append(f'%{val}%')

    query += " ORDER BY r.[QC No.] DESC"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = dictfetchall(cursor)

    return Response({'results': rows, 'total': len(rows)})


@api_view(['GET'])
@permission_classes([AllowAny])
def packaging_material_generate_qc(request):
    current_year = datetime.now().strftime('%y')
    category_code = 'PM'

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT TOP 1 [QC No.]
            FROM PackagingMaterialData
            WHERE [Material Category] = 'Packaged'
            AND [QC No.] LIKE %s
            ORDER BY [QC No.] DESC
        """, [f'%\\{current_year}{category_code}'])

        latest = cursor.fetchone()
        if latest and latest[0]:
            try:
                seq_part = latest[0].split('\\')[0]
                seq_num = int(seq_part.split('-')[0])
                new_num = f'{seq_num + 1:04d}'
            except (IndexError, ValueError):
                new_num = '0001'
        else:
            new_num = '0001'

        qc_number = f'{new_num}-00\\{current_year}{category_code}'

        cursor.execute(
            "SELECT COUNT(*) FROM PackagingMaterialData WHERE [QC No.] = %s",
            [qc_number]
        )
        while cursor.fetchone()[0] > 0:
            seq_num = int(new_num)
            new_num = f'{seq_num + 1:04d}'
            qc_number = f'{new_num}-00\\{current_year}{category_code}'
            cursor.execute(
                "SELECT COUNT(*) FROM PackagingMaterialData WHERE [QC No.] = %s",
                [qc_number]
            )

    return Response({'qc_number': qc_number})


# ──────────────────────────────────────────────
#  FINISHED PRODUCTS
# ──────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def finished_products(request):
    current_year = datetime.now().strftime('%y')
    qc_pattern = f'%{current_year}FP'

    if request.method == 'GET':
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 30))

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM FinishedProductData WHERE [QC No.] LIKE %s",
                [qc_pattern]
            )
            total = cursor.fetchone()[0]

            cursor.execute("""
                SELECT Date, [Material Name], [Material Code],
                       [Material Category], [Batch No.], [QC No.],
                       Micro, MicroStatus, Chemical, ChemicalStatus,
                       [Manufacture Date], [Expiry Date], Status,
                       Notes, [Created By],
                       Reviewed, [Reviewed By], [Reviewed Date]
                FROM FinishedProductData
                WHERE [QC No.] LIKE %s
                ORDER BY [QC No.] DESC
                OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
            """, [qc_pattern, offset, limit])
            rows = dictfetchall(cursor)

        return Response({'total': total, 'results': rows})

    elif request.method == 'POST':
        data = request.data
        username = data.get('username', 'Unknown')

        micro_s = data.get('micro_status', 'Pending')
        chem_s = data.get('chemical_status', 'Pending')
        if micro_s.lower() == 'accepted' and chem_s.lower() == 'accepted':
            final_status = 'Accepted'
        elif 'rejected' in (micro_s.lower(), chem_s.lower()):
            final_status = 'Rejected'
        else:
            final_status = 'Pending'

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO FinishedProductData (
                    Date, [Material Name], [Material Code], [Material Category],
                    [Batch No.], [QC No.], Micro, MicroStatus,
                    Chemical, ChemicalStatus,
                    [Manufacture Date], [Expiry Date], Status,
                    Notes, [Created By]
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                clean_datetime(data['date']), data['material'], data['material_code'],
                data['category'], data['batch'], data['qc'],
                data.get('micro', False), micro_s,
                data.get('chemical', False), chem_s,
                clean_date(data.get('manufacture_date')), clean_date(data.get('expiry_date')),
                final_status, data.get('notes', ''), username
            ])

            # Also insert into unified audit log
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Creation',
                entity_type='Finished Product',
                entity_id=data['qc'],
                details=f"Status: {final_status}"
            )

        return Response({'message': 'Entry added successfully'}, status=201)


@api_view(['PUT'])
@permission_classes([AllowAny])
def finished_product_detail(request, qc_no):
    data = request.data
    username = data.get('username', 'Unknown')

    micro_s = data.get('micro_status', 'Pending')
    chem_s = data.get('chemical_status', 'Pending')
    if micro_s.lower() == 'accepted' and chem_s.lower() == 'accepted':
        final_status = 'Accepted'
    elif 'rejected' in (micro_s.lower(), chem_s.lower()):
        final_status = 'Rejected'
    else:
        final_status = 'Pending'

    with connection.cursor() as cursor:
        # Fetch existing data for audit and fallback dates
        cursor.execute("""
            SELECT Date, [Material Name], [Material Code], [Material Category],
                   [Batch No.], [QC No.], Micro, MicroStatus, Chemical, ChemicalStatus,
                   [Manufacture Date], [Expiry Date], Status, Notes, Reviewed, [Reviewed By], [Reviewed Date]
            FROM FinishedProductData WHERE [QC No.] = %s
        """, [qc_no])
        old_row = cursor.fetchone()
        if not old_row:
            return Response({'error': 'Record not found'}, status=404)

        old_data = {
            'date': str(old_row[0]), 'material': old_row[1],
            'material_code': old_row[2], 'category': old_row[3],
            'batch': old_row[4], 'qc': old_row[5],
            'micro': old_row[6], 'micro_status': old_row[7],
            'chemical': old_row[8], 'chemical_status': old_row[9],
            'manufacture_date': str(old_row[10] or ''), 'expiry_date': str(old_row[11] or ''),
            'status': old_row[12], 'notes': old_row[13]
        }

        # Use incoming value if supplied; fall back to existing DB value
        new_mfg  = clean_date(data.get('manufacture_date')) if data.get('manufacture_date') else old_row[10]
        new_exp  = clean_date(data.get('expiry_date'))      if data.get('expiry_date')      else old_row[11]

        # Find changes
        changes = {}
        # Date comparison needs careful handling of None/empty vs strings
        compare_data = {**data, 'manufacture_date': new_mfg or '', 'expiry_date': new_exp or '', 'status': final_status}
        for key in old_data:
            if key in compare_data and str(compare_data[key]) != str(old_data[key]):
                changes[key] = {'old': str(old_data[key]), 'new': str(compare_data[key])}

        cursor.execute("""
            UPDATE FinishedProductData
            SET Date=%s, [Material Name]=%s, [Material Code]=%s,
                [Material Category]=%s, [Batch No.]=%s, [QC No.]=%s,
                Micro=%s, MicroStatus=%s, Chemical=%s, ChemicalStatus=%s,
                [Manufacture Date]=%s, [Expiry Date]=%s, Status=%s, Notes=%s
            WHERE [QC No.] = %s
        """, [
            clean_datetime(data['date']), data['material'], data['material_code'],
            data['category'], data['batch'], data['qc'],
            data.get('micro', False), micro_s,
            data.get('chemical', False), chem_s,
            new_mfg, new_exp,
            final_status, data.get('notes', ''), qc_no
        ])

        if changes:
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Edit',
                entity_type='Finished Product',
                entity_id=qc_no,
                old_values=json.dumps({k: v['old'] for k, v in changes.items()}),
                new_values=json.dumps({k: v['new'] for k, v in changes.items()})
            )

    return Response({'message': 'Entry updated successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def finished_product_mark_reviewed(request, qc_no):
    data = request.data
    username = data.get('username', 'Unknown')
    checked = data.get('chemical', False)
    new_status = data.get('chemical_status', 'Pending')
    today = date.today().isoformat()

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT Chemical, ChemicalStatus FROM FinishedProductData WHERE [QC No.] = %s",
            [qc_no]
        )
        old = cursor.fetchone()
        if not old:
            return Response({'error': 'Record not found'}, status=404)

        cursor.execute("""
            UPDATE FinishedProductData
            SET Chemical=%s, ChemicalStatus=%s, Reviewed=1,
                [Reviewed By]=%s, [Reviewed Date]=%s
            WHERE [QC No.] = %s
        """, [checked, new_status, username, today, qc_no])

        log_audit(
            cursor=cursor,
            username=username,
            action_type='Edit',
            entity_type='Finished Product',
            entity_id=qc_no,
            old_values=json.dumps({'Chemical': bool(old[0]), 'ChemicalStatus': old[1]}),
            new_values=json.dumps({'Chemical': checked, 'ChemicalStatus': new_status}),
            details="Marked as reviewed"
        )

    return Response({'message': 'Marked as reviewed'})


@api_view(['POST'])
@permission_classes([AllowAny])
def finished_products_search(request):
    data = request.data
    current_year = datetime.now().strftime('%y')

    query = """
        SELECT Date, [Material Name], [Material Code],
               [Material Category], [Batch No.], [QC No.],
               Micro, MicroStatus, Chemical, ChemicalStatus,
               [Manufacture Date], [Expiry Date], Status,
               Notes, [Created By],
               Reviewed, [Reviewed By], [Reviewed Date]
        FROM FinishedProductData
        WHERE 1=1
    """
    params = []

    year_filter = data.get('year_filter', current_year)
    query += " AND [QC No.] LIKE %s"
    params.append(f'%{year_filter}FP')

    for field, col in [
        ('material_name', "[Material Name]"),
        ('batch_number', "[Batch No.]"),
        ('qc_number', "[QC No.]"),
        ('material_code', "[Material Code]"),
        ('status', "Status"),
        ('notes', "Notes"),
    ]:
        val = data.get(field, '').strip()
        if val:
            query += f" AND {col} LIKE %s"
            params.append(f'%{val}%')

    query += " ORDER BY [QC No.] DESC"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = dictfetchall(cursor)

    return Response({'results': rows, 'total': len(rows)})


@api_view(['GET'])
@permission_classes([AllowAny])
def finished_product_generate_qc(request):
    current_year = datetime.now().strftime('%y')
    category_code = 'FP'

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT TOP 1 [QC No.]
            FROM FinishedProductData
            WHERE [Material Category] = 'Finished'
            AND [QC No.] LIKE %s
            ORDER BY [QC No.] DESC
        """, [f'%\\{current_year}{category_code}'])

        latest = cursor.fetchone()
        if latest and latest[0]:
            try:
                seq_part = latest[0].split('\\')[0]
                seq_num = int(seq_part.split('-')[0])
                new_num = f'{seq_num + 1:04d}'
            except (IndexError, ValueError):
                new_num = '0001'
        else:
            new_num = '0001'

        qc_number = f'{new_num}-00\\{current_year}{category_code}'

        cursor.execute(
            "SELECT COUNT(*) FROM FinishedProductData WHERE [QC No.] = %s",
            [qc_number]
        )
        while cursor.fetchone()[0] > 0:
            seq_num = int(new_num)
            new_num = f'{seq_num + 1:04d}'
            qc_number = f'{new_num}-00\\{current_year}{category_code}'
            cursor.execute(
                "SELECT COUNT(*) FROM FinishedProductData WHERE [QC No.] = %s",
                [qc_number]
            )

    return Response({'qc_number': qc_number})


# ──────────────────────────────────────────────
#  PRODUCTS / MATERIAL MANAGEMENT
# ──────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def products(request):
    if request.method == 'GET':
        search = request.query_params.get('search', '')
        criteria = request.query_params.get('criteria', 'ProductName')
        category = request.query_params.get('category', '')

        query = "SELECT ProductID, ProductName, ProductCategory FROM ProductNames WHERE 1=1"
        params = []

        if search:
            if criteria == 'ProductCategory':
                query += " AND ProductCategory LIKE %s"
            else:
                query += " AND ProductName LIKE %s"
            params.append(f'%{search}%')

        if category:
            query += " AND ProductCategory = %s"
            params.append(category)

        query += " ORDER BY ProductName"

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = dictfetchall(cursor)

        return Response({'results': rows})

    elif request.method == 'POST':
        name = request.data.get('name', '').strip()
        category = request.data.get('category', '').strip()

        if not name or not category:
            return Response({'error': 'Name and category are required'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT ProductName FROM ProductNames WHERE ProductName=%s AND ProductCategory=%s",
                [name, category]
            )
            if cursor.fetchone():
                return Response({'error': 'Product already exists in this category'}, status=400)

            cursor.execute(
                "INSERT INTO ProductNames (ProductName, ProductCategory) VALUES (%s, %s)",
                [name, category]
            )

            # Audit log
            username = request.data.get('username', 'System')
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Creation',
                entity_type='Product Master',
                entity_id=name,
                details=f"Category: {category}"
            )

        return Response({'message': 'Product added'}, status=201)


@api_view(['PUT'])
@permission_classes([AllowAny])
def product_detail(request, product_id):
    name = request.data.get('name', '').strip()
    category = request.data.get('category', '').strip()

    username = request.data.get('username', 'System')

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT ProductID FROM ProductNames WHERE ProductName=%s AND ProductCategory=%s AND ProductID != %s",
            [name, category, product_id]
        )
        if cursor.fetchone():
            return Response({'error': 'Product name already used'}, status=400)

        cursor.execute("SELECT ProductName, ProductCategory FROM ProductNames WHERE ProductID=%s", [product_id])
        old = cursor.fetchone()

        cursor.execute(
            "UPDATE ProductNames SET ProductName=%s, ProductCategory=%s WHERE ProductID=%s",
            [name, category, product_id]
        )

        if old:
            old_name, old_category = old[0], old[1]
            if old_name != name:
                # Synchronize name across material tables
                cursor.execute("UPDATE RawMaterialData SET [Material Name] = %s WHERE [Material Name] = %s", [name, old_name])
                cursor.execute("UPDATE PackagingMaterialData SET [Material Name] = %s WHERE [Material Name] = %s", [name, old_name])
                cursor.execute("UPDATE FinishedProductData SET [Material Name] = %s WHERE [Material Name] = %s", [name, old_name])

            if old_name != name or old_category != category:
                log_audit(
                    cursor=cursor,
                    username=username,
                    action_type='Edit',
                    entity_type='Product Master',
                    entity_id=product_id,
                    old_values=json.dumps({'ProductName': old_name, 'ProductCategory': old_category}),
                    new_values=json.dumps({'ProductName': name, 'ProductCategory': category}),
                    details=f"Synchronized name change from '{old_name}' to '{name}' across material records." if old_name != name else None
                )

    return Response({'message': 'Product updated'})


# ──────────────────────────────────────────────
#  USER MANAGEMENT
# ──────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def users(request):
    if request.method == 'GET':
        requester_role = request.query_params.get('role', '')
        with connection.cursor() as cursor:
            if requester_role == 'Production Manager':
                cursor.execute("SELECT ID, Username, Role FROM Users WHERE Role LIKE '%Production%' ORDER BY Username")
            else:
                cursor.execute("SELECT ID, Username, Role FROM Users ORDER BY Username")
            rows = dictfetchall(cursor)
        return Response({'results': rows})

    elif request.method == 'POST':
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        roles = request.data.get('roles', [])

        if not username or not password or not roles:
            return Response({'error': 'All fields required'}, status=400)

        hashed = bcrypt.hashpw(password.encode('utf-8'),
                               bcrypt.gensalt()).decode('utf-8')

        with connection.cursor() as cursor:
            # Enforce unique usernames at the application level
            cursor.execute("SELECT COUNT(*) FROM Users WHERE Username = %s", [username])
            if cursor.fetchone()[0] > 0:
                return Response({'error': f'Username "{username}" already exists'}, status=400)

            cursor.execute(
                "INSERT INTO Users (Username, Password, Role) VALUES (%s, %s, %s)",
                [username, hashed, roles[0]]
            )
            for r in roles[1:]:
                cursor.execute(
                    "INSERT INTO user_extra_roles (username, extra_role) VALUES (%s, %s)",
                    [username, r]
                )

            # Audit log
            actor = request.data.get('current_user', 'System')
            log_audit(
                cursor=cursor,
                username=actor,
                action_type='Creation',
                entity_type='User',
                entity_id=username,
                details=f"Roles: {', '.join(roles)}"
            )

        return Response({'message': 'User registered'}, status=201)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def user_detail(request, user_id):
    actor = request.data.get('current_user', 'System')

    with connection.cursor() as cursor:
        cursor.execute("SELECT Role, Username FROM Users WHERE ID = %s", [user_id])
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'User not found'}, status=404)
        if row[0] in ('Manager', 'Production Manager'):
            return Response({'error': 'Cannot delete Manager or Production Manager accounts'}, status=403)

        deleted_username = row[1]
        cursor.execute("DELETE FROM Users WHERE ID = %s", [user_id])

        log_audit(
            cursor=cursor,
            username=actor,
            action_type='Deletion',
            entity_type='User',
            entity_id=deleted_username,
            details=f"Deleted user with ID {user_id}"
        )

    return Response({'message': 'User deleted'})


# ──────────────────────────────────────────────
#  AUDIT TRAIL
# ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def audit_trail(request):
    # New unified AuditLogs query
    user_filter = request.query_params.get('user', '').strip()
    entity_type = request.query_params.get('entity_type', '').strip()
    action_type = request.query_params.get('action', '').strip()
    date_from = request.query_params.get('date_from', '').strip()
    date_to = request.query_params.get('date_to', '').strip()
    search = request.query_params.get('search', '').strip()
    offset = int(request.query_params.get('offset', 0))
    limit = int(request.query_params.get('limit', 50))

    query = """
        SELECT LogID, Timestamp, Username, ActionType, EntityType, EntityID,
               OldValues, NewValues, Details
        FROM AuditLogs
        WHERE 1=1
    """
    params = []

    if user_filter:
        query += " AND Username LIKE %s"
        params.append(f"%{user_filter}%")

    if entity_type:
        query += " AND EntityType = %s"
        params.append(entity_type)

    if action_type:
        query += " AND ActionType = %s"
        params.append(action_type)

    if date_from:
        query += " AND Timestamp >= %s"
        params.append(f"{date_from} 00:00:00")

    if date_to:
        query += " AND Timestamp <= %s"
        params.append(f"{date_to} 23:59:59")
        
    if search:
        query += " AND (EntityID LIKE %s OR Details LIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY Timestamp DESC OFFSET %s ROWS FETCH NEXT %s ROWS ONLY"
    params.extend([offset, limit])

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = dictfetchall(cursor)
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) FROM AuditLogs WHERE 1=1" + query.split("WHERE 1=1")[1].split("ORDER BY")[0]
        cursor.execute(count_query, params[:-2])
        total = cursor.fetchone()[0]

    return Response({'results': rows, 'total': total})


# ──────────────────────────────────────────────
#  YEARLY REPORTS
# ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def yearly_report(request, category):
    year = request.query_params.get('year', str(datetime.now().year))
    year_suffix = year[-2:]
    offset = int(request.query_params.get('offset', 0))
    limit = int(request.query_params.get('limit', 30))

    table_map = {
        'raw': ('RawMaterialData', 'RM'),
        'packaging': ('PackagingMaterialData', 'PM'),
        'finished': ('FinishedProductData', 'FP'),
    }

    if category not in table_map:
        return Response({'error': 'Invalid category'}, status=400)

    table_name, code = table_map[category]
    qc_pattern = f'%{year_suffix}{code}'

    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT COUNT(*) FROM {table_name} WHERE [QC No.] LIKE %s",
            [qc_pattern]
        )
        total = cursor.fetchone()[0]

        cursor.execute(f"""
            SELECT * FROM {table_name}
            WHERE [QC No.] LIKE %s
            ORDER BY [QC No.] DESC
            OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
        """, [qc_pattern, offset, limit])
        rows = dictfetchall(cursor)

    return Response({'total': total, 'results': rows})


# ──────────────────────────────────────────────
#  PRODUCT NAMES for dropdowns
# ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def product_names_by_category(request):
    category = request.query_params.get('category', '')
    search = request.query_params.get('search', '')

    query = "SELECT ProductName, ProductCategory FROM ProductNames WHERE 1=1"
    params = []

    if category:
        query += " AND ProductCategory = %s"
        params.append(category)
    if search:
        query += " AND ProductName LIKE %s"
        params.append(f'%{search}%')

    query += " ORDER BY ProductName"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = dictfetchall(cursor)

    return Response({'results': rows})


# ──────────────────────────────────────────────
#  SERVER TIME
# ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def server_time(request):
    """Return the current server datetime formatted for datetime-local inputs."""
    now = datetime.now()
    return Response({'datetime': now.strftime('%Y-%m-%dT%H:%M')})


# ──────────────────────────────────────────────
#  ADMIN HELPERS
# ──────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def drop_username_unique_constraint(request):
    """
    One-time helper: drops the FK + UNIQUE constraint on Users.Username so that
    multiple users can share the same display name.  ID is the true identifier.
    Safe to call multiple times — it does nothing if the constraints are gone.
    """
    sql = """
        -- Step 1: Drop FK on user_extra_roles that references Users.Username
        DECLARE @fk NVARCHAR(256);
        SELECT TOP 1 @fk = fk.name
        FROM sys.foreign_keys fk
        WHERE fk.parent_object_id = OBJECT_ID('user_extra_roles')
          AND fk.referenced_object_id = OBJECT_ID('Users');
        IF @fk IS NOT NULL
            EXEC('ALTER TABLE user_extra_roles DROP CONSTRAINT [' + @fk + ']');

        -- Step 2: Drop the UNIQUE constraint on Users.Username
        DECLARE @cn NVARCHAR(256);
        SELECT TOP 1 @cn = kc.name
        FROM sys.key_constraints kc
        JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id
                                  AND ic.index_id  = kc.unique_index_id
        JOIN sys.columns c        ON c.object_id   = kc.parent_object_id
                                  AND c.column_id  = ic.column_id
        WHERE kc.parent_object_id = OBJECT_ID('Users')
          AND kc.type = 'UQ'
          AND c.name  = 'Username';
        IF @cn IS NOT NULL
            EXEC('ALTER TABLE Users DROP CONSTRAINT [' + @cn + ']');
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql)
        return Response({'message': 'Constraints dropped (or were already absent)'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ──────────────────────────────────────────────
#  PRODUCTION AUDIT
# ──────────────────────────────────────────────

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def production_machines(request):
    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute("""
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE Name = N'Section' 
                    AND Object_ID = Object_ID(N'ProductionMachine')
                )
                BEGIN
                    ALTER TABLE ProductionMachine ADD Section NVARCHAR(255)
                END
            """)
            cursor.execute("SELECT ID, Name, Section FROM ProductionMachine ORDER BY Name")
            rows = dictfetchall(cursor)
        return Response({'results': rows})

    elif request.method == 'POST':
        name = request.data.get('name', '').strip()
        section = request.data.get('section', '').strip()
        if not name or not section:
            return Response({'error': 'Name and Section are required'}, status=400)
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM ProductionMachine WHERE Name=%s", [name])
            if cursor.fetchone()[0] > 0:
                return Response({'error': 'Machine already exists'}, status=400)
            
            cursor.execute("INSERT INTO ProductionMachine (Name, Section) VALUES (%s, %s)", [name, section])
            
            # Audit log
            username = request.data.get('username', 'System')
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Creation',
                entity_type='Production Machine',
                entity_id=name,
                details=f"Section: {section}"
            )
        return Response({'message': 'Machine added'}, status=201)

    elif request.method == 'DELETE':
        m_id = request.data.get('id')
        if not m_id:
            return Response({'error': 'ID is required'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute("SELECT Name FROM ProductionMachine WHERE ID=%s", [m_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=404)
            name = row[0]

            cursor.execute("SELECT COUNT(*) FROM CleaningLogbook WHERE Machine=%s", [name])
            if cursor.fetchone()[0] > 0:
                return Response({'error': f'Cannot delete machine "{name}". It has cleaning log records.'}, status=400)

            cursor.execute("SELECT COUNT(*) FROM OperationLogbook WHERE Machine=%s", [name])
            if cursor.fetchone()[0] > 0:
                return Response({'error': f'Cannot delete machine "{name}". It has operation log records.'}, status=400)

            cursor.execute("DELETE FROM ProductionMachine WHERE ID=%s", [m_id])
            
            username = request.data.get('username', 'System')
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Deletion',
                entity_type='Production Machine',
                entity_id=name
            )
        return Response({'message': 'Machine deleted'})


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def production_sections(request):
    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute("SELECT ID, Name FROM ProductionSection ORDER BY Name")
            rows = dictfetchall(cursor)
        return Response({'results': rows})

    elif request.method == 'POST':
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Name is required'}, status=400)
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM ProductionSection WHERE Name=%s", [name])
            if cursor.fetchone()[0] > 0:
                return Response({'error': 'Section already exists'}, status=400)
            
            cursor.execute("INSERT INTO ProductionSection (Name) VALUES (%s)", [name])
            
            username = request.data.get('username', 'System')
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Creation',
                entity_type='Production Section',
                entity_id=name
            )
        return Response({'message': 'Section added'}, status=201)

    elif request.method == 'DELETE':
        s_id = request.data.get('id')
        if not s_id:
            return Response({'error': 'ID is required'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute("SELECT Name FROM ProductionSection WHERE ID=%s", [s_id])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=404)
            name = row[0]

            cursor.execute("SELECT COUNT(*) FROM ProductionMachine WHERE Section=%s", [name])
            if cursor.fetchone()[0] > 0:
                return Response({'error': f'Cannot delete section "{name}". There are machines linked to it.'}, status=400)

            cursor.execute("DELETE FROM ProductionSection WHERE ID=%s", [s_id])
            
            username = request.data.get('username', 'System')
            log_audit(
                cursor=cursor,
                username=username,
                action_type='Deletion',
                entity_type='Production Section',
                entity_id=name
            )
        return Response({'message': 'Section deleted'})


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def cleaning_logbooks(request):
    if request.method == 'GET':
        machine = request.query_params.get('machine', '')
        section = request.query_params.get('section', '')
        date_from = request.query_params.get('date_from', '')
        date_to = request.query_params.get('date_to', '')
        
        query = """
            SELECT ID, Machine, Section, Date, ProductName, BatchNo, BatchSize, 
                   TimeStart, TimeEnd, DueDate, CleaningReason, DoneBy, CheckedBy
            FROM CleaningLogbook
            WHERE 1=1
        """
        params = []
        
        if machine:
            query += " AND Machine = %s"
            params.append(machine)
        if section:
            query += " AND Section = %s"
            params.append(section)
            
        if date_from:
            query += " AND Date >= %s"
            params.append(date_from)
        if date_to:
            query += " AND Date <= %s"
            params.append(date_to)
            
        query += " ORDER BY Date DESC"
        
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = dictfetchall(cursor)
        return Response({'results': rows})

    elif request.method == 'POST':
        data = request.data
        username = data.get('username', 'Unknown')
        
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO CleaningLogbook (
                    Machine, Section, Date, ProductName, BatchNo, BatchSize, 
                    TimeStart, TimeEnd, DueDate, CleaningReason, DoneBy, CheckedBy
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                data.get('machine'), data.get('section'), clean_datetime(data.get('date')),
                data.get('product_name'), data.get('batch_no'), data.get('batch_size'),
                data.get('time_start'), data.get('time_end'), clean_datetime(data.get('due_date')),
                data.get('cleaning_reason'), data.get('done_by'), data.get('checked_by')
            ])
            
            
            cursor.execute("SELECT @@IDENTITY")
            new_id = int(cursor.fetchone()[0])
            
            details = f"Product: {data.get('product_name')} | Batch: {data.get('batch_no')}"
            log_username = data.get('done_by') or username
            log_timestamp = clean_datetime(data.get('date'))
            log_production_audit(
                cursor=cursor,
                username=log_username,
                action_type='Creation',
                entity_type='Cleaning Logbook',
                entity_id=str(new_id),
                details=details,
                custom_timestamp=log_timestamp
            )
            
        return Response({'message': 'Logbook entry added'}, status=201)


@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def cleaning_logbook_detail(request, log_id):
    if request.method == 'PUT':
        data = request.data
        username = data.get('username', 'Unknown')
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM CleaningLogbook WHERE ID=%s", [log_id])
            old_data = dictfetchone(cursor)

            cursor.execute("""
                UPDATE CleaningLogbook
                SET Machine=%s, Section=%s, Date=%s, ProductName=%s, BatchNo=%s, BatchSize=%s, 
                    TimeStart=%s, TimeEnd=%s, DueDate=%s, CleaningReason=%s, DoneBy=%s, CheckedBy=%s
                WHERE ID=%s
            """, [
                data.get('machine'), data.get('section'), clean_datetime(data.get('date')),
                data.get('product_name'), data.get('batch_no'), data.get('batch_size'),
                data.get('time_start'), data.get('time_end'), clean_datetime(data.get('due_date')),
                data.get('cleaning_reason'), data.get('done_by'), data.get('checked_by'),
                log_id
            ])
            
            cursor.execute("SELECT * FROM CleaningLogbook WHERE ID=%s", [log_id])
            new_data = dictfetchone(cursor)

            log_username = data.get('done_by') or username
            log_timestamp = clean_datetime(data.get('date'))
            is_superadmin = 'superadmin' in request.data.get('roles', [])

            # Fields to exclude from audit values (internal/non-meaningful for history)
            _EXCLUDE_KEYS = {'ID', 'DueDate'}

            def _filter(d):
                """Return a copy of dict d with excluded keys removed."""
                return {k: v for k, v in (d or {}).items() if k not in _EXCLUDE_KEYS}

            if is_superadmin:
                details = f"Product: {data.get('product_name')} | Batch: {data.get('batch_no')}"
                # Update the Creation audit log to reflect the super admin's corrected values
                cursor.execute("""
                    UPDATE ProductionAuditLogs
                    SET Username=%s, Timestamp=%s, Details=%s
                    WHERE EntityType='Cleaning Logbook' AND EntityID=%s AND ActionType='Creation'
                """, [log_username, log_timestamp, details, str(log_id)])

                # 1) Delete Edit rows that are BEFORE the new creation date —
                #    they are timeline-impossible (an edit cannot predate its creation)
                if log_timestamp:
                    cursor.execute("""
                        DELETE FROM ProductionAuditLogs
                        WHERE EntityType='Cleaning Logbook' AND EntityID=%s
                          AND ActionType='Edit' AND Timestamp < %s
                    """, [str(log_id), log_timestamp])

                # 2) For Edit rows that survive (Timestamp >= creation), chain their
                #    OldValues so diffs remain accurate across sequential edits:
                #    - First surviving edit's OldValues = super admin's corrected state
                #    - Each following edit's OldValues = prior edit's NewValues
                new_data_json = json.dumps(_filter(new_data), default=str) if new_data else '{}'
                cursor.execute("""
                    SELECT LogID, NewValues
                    FROM ProductionAuditLogs
                    WHERE EntityType='Cleaning Logbook' AND EntityID=%s AND ActionType='Edit'
                    ORDER BY Timestamp ASC, LogID ASC
                """, [str(log_id)])
                surviving_edits = cursor.fetchall()
                prev_new_values = new_data_json
                for (edit_log_id, edit_new_values) in surviving_edits:
                    cursor.execute("""
                        UPDATE ProductionAuditLogs
                        SET OldValues=%s
                        WHERE LogID=%s
                    """, [prev_new_values, edit_log_id])
                    prev_new_values = edit_new_values  # next edit's old = this edit's new
            else:
                log_production_audit(
                    cursor=cursor,
                    username=log_username,
                    action_type='Edit',
                    entity_type='Cleaning Logbook',
                    entity_id=str(log_id),
                    old_values=json.dumps(_filter(old_data), default=str) if old_data else None,
                    new_values=json.dumps(_filter(new_data), default=str) if new_data else None,
                    custom_timestamp=log_timestamp
                )
            
        return Response({'message': 'Logbook entry updated'})
        
    elif request.method == 'DELETE':
        username = request.data.get('username', 'Unknown')
        is_superadmin = 'superadmin' in request.data.get('roles', [])
        with connection.cursor() as cursor:
            cursor.execute("SELECT Machine, Section, ProductName, DoneBy, Date FROM CleaningLogbook WHERE ID=%s", [log_id])
            row = cursor.fetchone()
            del_details = f"Machine: {row[0]} | Section: {row[1]} | Product: {row[2]}" if row else ""
            log_username = row[3] if row and row[3] else username
            log_timestamp = row[4] if row else None

            cursor.execute("DELETE FROM CleaningLogbook WHERE ID=%s", [log_id])
            
            if is_superadmin:
                cursor.execute("DELETE FROM ProductionAuditLogs WHERE EntityType='Cleaning Logbook' AND EntityID=%s", [str(log_id)])
            else:
                log_production_audit(
                    cursor=cursor,
                    username=log_username,
                    action_type='Deletion',
                    entity_type='Cleaning Logbook',
                    entity_id=str(log_id),
                    details=del_details,
                    custom_timestamp=log_timestamp
                )
        return Response({'message': 'Logbook entry deleted'})

@api_view(['GET'])
@permission_classes([AllowAny])
def production_audit_trail(request):
    user_filter = request.query_params.get('user', '').strip()
    entity_type = request.query_params.get('entity_type', '').strip()
    action_type = request.query_params.get('action', '').strip()
    date_from = request.query_params.get('date_from', '').strip()
    date_to = request.query_params.get('date_to', '').strip()
    search = request.query_params.get('search', '').strip()
    product_name = request.query_params.get('product_name', '').strip()
    batch_no = request.query_params.get('batch_no', '').strip()
    offset = int(request.query_params.get('offset', 0))
    limit = int(request.query_params.get('limit', 50))

    query = """
        SELECT LogID, Timestamp, Username, ActionType, EntityType, EntityID,
               OldValues, NewValues, Details
        FROM ProductionAuditLogs
        WHERE 1=1
    """
    params = []

    if user_filter:
        query += " AND Username LIKE %s"
        params.append(f"%{user_filter}%")

    if entity_type:
        query += " AND EntityType = %s"
        params.append(entity_type)

    if action_type:
        query += " AND ActionType = %s"
        params.append(action_type)

    if date_from:
        query += " AND Timestamp >= %s"
        params.append(f"{date_from} 00:00:00")

    if date_to:
        query += " AND Timestamp <= %s"
        params.append(f"{date_to} 23:59:59")
        
    if search:
        query += " AND (EntityID LIKE %s OR Details LIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])

    if product_name:
        query += " AND (Details LIKE %s OR NewValues LIKE %s OR OldValues LIKE %s)"
        params.extend([f"%{product_name}%", f"%{product_name}%", f"%{product_name}%"])

    if batch_no:
        query += " AND (Details LIKE %s OR NewValues LIKE %s OR OldValues LIKE %s)"
        params.extend([f"%{batch_no}%", f"%{batch_no}%", f"%{batch_no}%"])

    query += " ORDER BY Timestamp DESC OFFSET %s ROWS FETCH NEXT %s ROWS ONLY"
    params.extend([offset, limit])

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        rows = dictfetchall(cursor)
        
        # Get total count for pagination
        count_query = "SELECT COUNT(*) FROM ProductionAuditLogs WHERE 1=1" + query.split("WHERE 1=1")[1].split("ORDER BY")[0]
        cursor.execute(count_query, params[:-2])
        total = cursor.fetchone()[0]

    return Response({'results': rows, 'total': total})


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def operation_logbooks(request):
    if request.method == 'GET':
        machine = request.query_params.get('machine', '')
        section = request.query_params.get('section', '')
        date_from = request.query_params.get('date_from', '')
        date_to = request.query_params.get('date_to', '')
        
        query = """
            SELECT ID, Machine, Section, Date, ProductName, BatchNo, BatchSize, 
                   OperationStart, OperationEnd, IncidentBrief, IncidentAction, DoneBy, CheckedBy
            FROM OperationLogbook
            WHERE 1=1
        """
        params = []
        
        if machine:
            query += " AND Machine = %s"
            params.append(machine)
        if section:
            query += " AND Section = %s"
            params.append(section)
            
        if date_from:
            query += " AND Date >= %s"
            params.append(date_from)
        if date_to:
            query += " AND Date <= %s"
            params.append(date_to)
            
        query += " ORDER BY Date DESC"
        
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = dictfetchall(cursor)
        return Response({'results': rows})

    elif request.method == 'POST':
        data = request.data
        username = data.get('username', 'Unknown')
        
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO OperationLogbook (
                    Machine, Section, Date, ProductName, BatchNo, BatchSize, 
                    OperationStart, OperationEnd, IncidentBrief, IncidentAction, DoneBy, CheckedBy
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                data.get('machine'), data.get('section'), clean_datetime(data.get('date')),
                data.get('product_name'), data.get('batch_no'), data.get('batch_size'),
                data.get('operation_start'), data.get('operation_end'), 
                data.get('incident_brief'), data.get('incident_action'), 
                data.get('done_by'), data.get('checked_by')
            ])
            
            cursor.execute("SELECT @@IDENTITY")
            new_id = int(cursor.fetchone()[0])
            
            details = f"Product: {data.get('product_name')} | Batch: {data.get('batch_no')}"
            log_username = data.get('done_by') or username
            log_timestamp = clean_datetime(data.get('date'))
            log_production_audit(
                cursor=cursor,
                username=log_username,
                action_type='Creation',
                entity_type='Operation Logbook',
                entity_id=str(new_id),
                details=details,
                custom_timestamp=log_timestamp
            )
            
        return Response({'message': 'Operation logbook entry added'}, status=201)


@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def operation_logbook_detail(request, log_id):
    if request.method == 'PUT':
        data = request.data
        username = data.get('username', 'Unknown')
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM OperationLogbook WHERE ID=%s", [log_id])
            old_data = dictfetchone(cursor)

            cursor.execute("""
                UPDATE OperationLogbook
                SET Machine=%s, Section=%s, Date=%s, ProductName=%s, BatchNo=%s, BatchSize=%s, 
                    OperationStart=%s, OperationEnd=%s, IncidentBrief=%s, IncidentAction=%s, DoneBy=%s, CheckedBy=%s
                WHERE ID=%s
            """, [
                data.get('machine'), data.get('section'), clean_datetime(data.get('date')),
                data.get('product_name'), data.get('batch_no'), data.get('batch_size'),
                data.get('operation_start'), data.get('operation_end'), 
                data.get('incident_brief'), data.get('incident_action'), 
                data.get('done_by'), data.get('checked_by'),
                log_id
            ])
            
            cursor.execute("SELECT * FROM OperationLogbook WHERE ID=%s", [log_id])
            new_data = dictfetchone(cursor)

            log_username = data.get('done_by') or username
            log_timestamp = clean_datetime(data.get('date'))
            is_superadmin = 'superadmin' in request.data.get('roles', [])

            if is_superadmin:
                details = f"Product: {data.get('product_name')} | Batch: {data.get('batch_no')}"
                # Update the Creation audit log to reflect the super admin's corrected values
                cursor.execute("""
                    UPDATE ProductionAuditLogs
                    SET Username=%s, Timestamp=%s, Details=%s
                    WHERE EntityType='Operation Logbook' AND EntityID=%s AND ActionType='Creation'
                """, [log_username, log_timestamp, details, str(log_id)])

                # 1) Delete Edit rows that are BEFORE the new creation date —
                #    they are timeline-impossible (an edit cannot predate its creation)
                if log_timestamp:
                    cursor.execute("""
                        DELETE FROM ProductionAuditLogs
                        WHERE EntityType='Operation Logbook' AND EntityID=%s
                          AND ActionType='Edit' AND Timestamp < %s
                    """, [str(log_id), log_timestamp])

                # 2) For Edit rows that survive (Timestamp >= creation), chain their
                #    OldValues so diffs remain accurate across sequential edits:
                #    - First surviving edit's OldValues = super admin's corrected state
                #    - Each following edit's OldValues = prior edit's NewValues
                new_data_json = json.dumps(new_data, default=str) if new_data else '{}'
                cursor.execute("""
                    SELECT LogID, NewValues
                    FROM ProductionAuditLogs
                    WHERE EntityType='Operation Logbook' AND EntityID=%s AND ActionType='Edit'
                    ORDER BY Timestamp ASC
                """, [str(log_id)])
                surviving_edits = cursor.fetchall()
                prev_new_values = new_data_json
                for (edit_log_id, edit_new_values) in surviving_edits:
                    cursor.execute("""
                        UPDATE ProductionAuditLogs
                        SET OldValues=%s
                        WHERE LogID=%s
                    """, [prev_new_values, edit_log_id])
                    prev_new_values = edit_new_values  # next edit's old = this edit's new
            else:
                log_production_audit(
                    cursor=cursor,
                    username=log_username,
                    action_type='Edit',
                    entity_type='Operation Logbook',
                    entity_id=str(log_id),
                    old_values=json.dumps(old_data, default=str) if old_data else None,
                    new_values=json.dumps(new_data, default=str) if new_data else None,
                    custom_timestamp=log_timestamp
                )
            
        return Response({'message': 'Operation logbook entry updated'})
        
    elif request.method == 'DELETE':
        username = request.data.get('username', 'Unknown')
        is_superadmin = 'superadmin' in request.data.get('roles', [])
        with connection.cursor() as cursor:
            cursor.execute("SELECT Machine, Section, ProductName, DoneBy, Date FROM OperationLogbook WHERE ID=%s", [log_id])
            row = cursor.fetchone()
            del_details = f"Machine: {row[0]} | Section: {row[1]} | Product: {row[2]}" if row else ""
            log_username = row[3] if row and row[3] else username
            log_timestamp = row[4] if row else None

            cursor.execute("DELETE FROM OperationLogbook WHERE ID=%s", [log_id])
            
            if is_superadmin:
                cursor.execute("DELETE FROM ProductionAuditLogs WHERE EntityType='Operation Logbook' AND EntityID=%s", [str(log_id)])
            else:
                log_production_audit(
                    cursor=cursor,
                    username=log_username,
                    action_type='Deletion',
                    entity_type='Operation Logbook',
                    entity_id=str(log_id),
                    details=del_details,
                    custom_timestamp=log_timestamp
                )
        return Response({'message': 'Operation logbook entry deleted'})

# ──────────────────────────────────────────────
#  PRODUCTION PRODUCTS
# ──────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def production_products(request):
    if request.method == 'GET':
        search = request.query_params.get('search', '')
        query = "SELECT ID, ProductName, ProductCode FROM ProductionProducts WHERE 1=1"
        params = []
        if search:
            query += " AND (ProductName LIKE %s OR ProductCode LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        query += " ORDER BY ProductName ASC"

        with connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = dictfetchall(cursor)
        return Response({'results': rows})

    elif request.method == 'POST':
        data = request.data
        product_name = data.get('ProductName', '').strip()
        product_code = data.get('ProductCode', '').strip()
        
        if not product_name:
            return Response({'error': 'Product Name is required'}, status=400)
            
        with connection.cursor() as cursor:
            # Prevent duplicate product names
            cursor.execute("SELECT COUNT(*) FROM ProductionProducts WHERE ProductName = %s", [product_name])
            if cursor.fetchone()[0] > 0:
                return Response({'error': f"A product named '{product_name}' already exists!"}, status=400)
                
            cursor.execute("""
                INSERT INTO ProductionProducts (ProductName, ProductCode)
                VALUES (%s, %s)
            """, [product_name, product_code])
        return Response({'message': 'Product added successfully'})

@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def production_product_detail(request, product_id):
    if request.method == 'PUT':
        data = request.data
        product_name = data.get('ProductName', '').strip()
        product_code = data.get('ProductCode', '').strip()
        
        if not product_name:
            return Response({'error': 'Product Name is required'}, status=400)

        with connection.cursor() as cursor:
            # Prevent updating to a name that already belongs to another product ID
            cursor.execute("SELECT ID FROM ProductionProducts WHERE ProductName = %s AND ID != %s", [product_name, product_id])
            if cursor.fetchone():
                return Response({'error': f"A product named '{product_name}' already exists!"}, status=400)

            cursor.execute("""
                UPDATE ProductionProducts
                SET ProductName=%s, ProductCode=%s
                WHERE ID=%s
            """, [product_name, product_code, product_id])
        return Response({'message': 'Product updated successfully'})

    elif request.method == 'DELETE':
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM ProductionProducts WHERE ID=%s", [product_id])
        return Response({'message': 'Product deleted successfully'})

