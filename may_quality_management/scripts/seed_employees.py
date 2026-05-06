"""
Genera empleados de prueba con custom_codigo_interno para probar el dashboard
de QC (búsqueda por nombre o código interno).

Uso:
    bench --site frontend execute \\
        may_quality_management.scripts.seed_employees.seed_test_employees

    bench --site frontend execute \\
        may_quality_management.scripts.seed_employees.seed_test_employees \\
        --kwargs "{'count': 100, 'start_code': 900}"

Para limpiar:
    bench --site frontend execute \\
        may_quality_management.scripts.seed_employees.delete_test_employees
"""

import random
from datetime import date, timedelta

import frappe

FIRST_NAMES = [
    "Juan", "Maria", "Carlos", "Ana", "Luis", "Sofia", "Pedro", "Lucia",
    "Jorge", "Elena", "Diego", "Carmen", "Miguel", "Rosa", "Andres",
    "Patricia", "Fernando", "Daniela", "Roberto", "Gabriela", "Hector",
    "Veronica", "Ricardo", "Beatriz", "Alejandro", "Marta", "Sergio",
    "Cecilia", "Pablo", "Adriana", "Eduardo", "Silvia", "Manuel",
    "Claudia", "Ernesto", "Pilar", "Oscar", "Liliana", "Gustavo", "Irene",
    "Byron", "Walter", "Mynor", "Estuardo", "Amilcar", "Wilfredo",
    "Edwin", "Ileana", "Astrid", "Karla",
]

LAST_NAMES = [
    "Lopez", "Gonzalez", "Perez", "Garcia", "Rodriguez", "Martinez",
    "Hernandez", "Sanchez", "Ramirez", "Flores", "Torres", "Diaz",
    "Vasquez", "Castillo", "Morales", "Ortiz", "Reyes", "Cruz", "Mendoza",
    "Aguilar", "Jimenez", "Romero", "Alvarez", "Ruiz", "Gomez", "Vargas",
    "Ramos", "Cabrera", "Estrada", "Salazar", "Cordon", "Recinos",
    "Solis", "Quiñonez", "Urizar", "Najera", "Pacheco", "Barrios",
    "Bonilla", "Marroquin", "Velasquez", "Maldonado", "Coronado",
]


def _get_default_company():
    company = (
        frappe.defaults.get_global_default("company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
    )
    if not company:
        rows = frappe.get_all("Company", limit=1, pluck="name")
        company = rows[0] if rows else None
    if not company:
        frappe.throw(
            "No hay ninguna empresa creada en este site. "
            "Crea una Company antes de correr el seed."
        )
    return company


def _build_employee_doc(codigo, company, today):
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    last2 = random.choice(LAST_NAMES)
    full_name = f"{first} {last} {last2}"

    age_days = random.randint(20 * 365, 55 * 365)
    join_days = random.randint(30, 5 * 365)

    return {
        "doctype": "Employee",
        "first_name": first,
        "last_name": f"{last} {last2}",
        "employee_name": full_name,
        "gender": random.choice(["Male", "Female"]),
        "date_of_birth": (today - timedelta(days=age_days)).isoformat(),
        "date_of_joining": (today - timedelta(days=join_days)).isoformat(),
        "company": company,
        "status": "Active",
        "custom_codigo_interno": codigo,
    }


def seed_test_employees(count=100, start_code=900, dry_run=False):
    """Crea `count` empleados de prueba con custom_codigo_interno secuencial.

    No re-crea empleados que ya tengan el mismo custom_codigo_interno.
    """
    count = int(count)
    start_code = int(start_code)
    company = _get_default_company()
    today = date.today()

    created = []
    skipped = []
    errors = []

    for i in range(count):
        codigo = str(start_code + i)
        existing = frappe.db.exists("Employee", {"custom_codigo_interno": codigo})
        if existing:
            skipped.append(codigo)
            continue

        doc_data = _build_employee_doc(codigo, company, today)
        if dry_run:
            created.append(f"(dry-run) {codigo} -> {doc_data['employee_name']}")
            continue

        try:
            emp = frappe.get_doc(doc_data)
            emp.insert(ignore_permissions=True)
            created.append(f"{emp.name} ({codigo}) - {emp.employee_name}")
        except Exception as e:
            errors.append(f"{codigo}: {e}")

    if not dry_run:
        frappe.db.commit()

    print(f"Empresa: {company}")
    print(f"Creados: {len(created)}")
    print(f"Omitidos (ya existian): {len(skipped)}")
    if errors:
        print(f"Errores: {len(errors)}")
        for err in errors[:10]:
            print(f"  - {err}")
    if created:
        print("Primeros 5:")
        for line in created[:5]:
            print(f"  - {line}")

    return {
        "company": company,
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }


def delete_test_employees(start_code=900, end_code=None, count=100):
    """Elimina los empleados creados por seed_test_employees segun rango de codigo."""
    start_code = int(start_code)
    if end_code is None:
        end_code = start_code + int(count) - 1
    else:
        end_code = int(end_code)

    codes = [str(c) for c in range(start_code, end_code + 1)]
    rows = frappe.get_all(
        "Employee",
        filters={"custom_codigo_interno": ["in", codes]},
        pluck="name",
    )

    deleted = []
    errors = []
    for emp_name in rows:
        try:
            frappe.delete_doc("Employee", emp_name, force=1, ignore_permissions=True)
            deleted.append(emp_name)
        except Exception as e:
            errors.append(f"{emp_name}: {e}")

    frappe.db.commit()
    print(f"Eliminados: {len(deleted)}")
    if errors:
        print(f"Errores: {len(errors)}")
        for err in errors[:10]:
            print(f"  - {err}")
    return {"deleted": deleted, "errors": errors}
