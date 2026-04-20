# Fix "Unexpected token '<'" Error on Materials Pages

The "Unexpected token '<'" error in the frontend is caused by the backend returning an HTML 500 error page instead of a JSON response. This happens because the SQL queries are throwing an exception during execution.

## Root Cause Analysis

1. **Empty Date Strings**: In [views.py](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py), when adding or editing Raw Materials, the frontend sends `manufacture_date` and `expiry_date` as empty strings (`''`) if the user doesn't pick a date. The SQL Server backend expects a valid `DATE` or `NULL`. An empty string causes a conversion error.
2. **Missing `[Material Category]` in Packaging**: In [packaging_materials](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py#429-487) (POST), the `INSERT` statement lists `[Material Category]` in the columns, but the values array does not supply `data['category']` in the correct position compared to the columns. Wait, let's review:
   ```python
   INSERT INTO PackagingMaterialData (
       Date, [Material Name], [Material Code], [Material Category],
       [QC No.], Micro, Chemical, Manufacturer, Supplier,
       Status, Notes, [Created By]
   ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
   ```
   ```python
       data['date'], data['material'], data['material_code'],
       data['category'], data['qc'], ...
   ```
   This actually looks correct in terms of parameter count. The *actual* error is likely just the date parsing for Raw Materials, or another missing parameter mismatch.

Let's look at [raw_materials](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py#169-246) POST:
```python
        data.get('manufacture_date', ''), data.get('expiry_date', ''),
```
If these are passed as `''`, SQL Server will try to cast `''` to [date](file:///c:/Users/mohamed.saad/Desktop/Web/frontend/js/api.js#192-198) and fail, or it will default to `1900-01-01`. Furthermore, `pyodbc` might actually crash if it expects a date format but receives `''`.

To fix this, we need to handle empty date strings by converting them to `None` (which pyodbc translates to `NULL` in SQL) before passing them to the parameterized queries.

## Proposed Changes

### Backend ([c:\Users\mohamed.saad\Desktop\Web\backend\api\views.py](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py))
Update all raw material and finished product insertions and updates to map empty dates to `None`:

#### [MODIFY] [views.py](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py) (file:///c:\Users\mohamed.saad\Desktop\Web\backend\api\views.py)
* Update [raw_materials](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py#169-246) (POST):
  Change `data.get('manufacture_date', '')` to `data.get('manufacture_date') or None`
  Change `data.get('expiry_date', '')` to `data.get('expiry_date') or None`
* Update [raw_material_detail](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py#248-318) (PUT):
  Apply the same `or None` logic for `manufacture_date` and `expiry_date`.
* Update [finished_products](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py#614-679) (POST) and [finished_product_detail](file:///c:/Users/mohamed.saad/Desktop/Web/backend/api/views.py#681-714) (PUT) similarly.

## Verification Plan

### Automated Verification
* The project does not currently have a test suite in `backend/`. 
* I will run a local Python script against the [run_server.bat](file:///c:/Users/mohamed.saad/Desktop/Web/run_server.bat) implementation (once I start it correctly or verify the exact database config) to simulate the payload that previously failed.

### Manual Verification
* Instruct the user to restart the backend application using [run_server.bat](file:///c:/Users/mohamed.saad/Desktop/Web/run_server.bat).
* Ask the user to go to the Raw Materials page.
* Add a new Raw Material without specifying exactly the Manufacture Date or Expiry Date, and save. It should succeed with a "Added successfully" toast instead of failing with "Unexpected token '<'".
