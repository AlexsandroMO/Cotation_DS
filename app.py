from flask import Flask, render_template, request, jsonify, redirect, url_for
import sqlite3

app = Flask(__name__)

DB_NAME = "cotation.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def get_products():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT product FROM BASE_COTATION ORDER BY product")
    rows = cursor.fetchall()
    conn.close()
    unique_products = sorted(set(row[0] for row in rows))
    return unique_products

def get_compradores():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT comprador FROM email_db ORDER BY comprador")
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]

def get_units():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT unit FROM UN_BASE ORDER BY unit")
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]

@app.route('/get_ncm')
def get_ncm():
    product = request.args.get('product')
    if not product:
        return jsonify({'ncm': '', 'value': None})
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ncm, value FROM BASE_COTATION WHERE product = ?", (product,))
    row = cursor.fetchone()
    conn.close()
    if row:
        ncm, value = row
        return jsonify({
            'ncm': ncm if ncm else '',
            'value': float(value) if value is not None else None
        })
    else:
        return jsonify({'ncm': '', 'value': None})

@app.route('/get_email')
def get_email():
    comprador = request.args.get('comprador')
    if not comprador:
        return jsonify({'email': ''})

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM email_db WHERE comprador = ?", (comprador,))
    row = cursor.fetchone()
    conn.close()

    if row and row[0]:
        return jsonify({'email': row[0]})
    else:
        return jsonify({'email': ''})
    
@app.route('/')
def index():
    conn = get_db_connection()
    items = conn.execute("SELECT * FROM BASE_COTATION ORDER BY id DESC").fetchall()
    conn.close()
    products = get_products()
    units = get_units()
    compradores = get_compradores()   # <--- pegar compradores
    return render_template('index.html', items=items, products=products, units=units, compradores=compradores)


# >>> Aqui está a rota para "db_app", nome do endpoint é "db_app"
@app.route('/db_app')
def db_app():
    conn = get_db_connection()
    items = conn.execute("SELECT * FROM BASE_COTATION ORDER BY id DESC").fetchall()
    conn.close()
    products = get_products()
    units = get_units()
    return render_template('db-app.html', items=items, products=products, units=units)

# Demais rotas add, edit, delete (mantidas iguais)...

@app.route('/add', methods=['GET', 'POST'])
def add():
    if request.method == 'POST':
        category = request.form['category']
        product = request.form['product']
        description = request.form['description']
        ncm = request.form['ncm']
        value = float(request.form['value'] or 0)
        comments = request.form['comments'] or None

        conn = get_db_connection()
        conn.execute('''
            INSERT INTO BASE_COTATION (category, product, description, ncm, value, comments)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (category, product, description, ncm, value, comments))
        conn.commit()
        conn.close()
        return redirect(url_for('index'))

    products = get_products()
    units = get_units()
    return render_template('form.html', action="Adicionar", item=None, products=products, units=units)

@app.route('/edit/<int:item_id>', methods=['GET', 'POST'])
def edit(item_id):
    conn = get_db_connection()
    item = conn.execute("SELECT * FROM BASE_COTATION WHERE id = ?", (item_id,)).fetchone()

    if request.method == 'POST':
        category = request.form['category']
        product = request.form['product']
        description = request.form['description']
        ncm = request.form['ncm']
        value = float(request.form['value'] or 0)
        comments = request.form['comments'] or None

        conn.execute('''
            UPDATE BASE_COTATION
            SET category=?, product=?, description=?, ncm=?, value=?, comments=?
            WHERE id=?
        ''', (category, product, description, ncm, value, comments, item_id))
        conn.commit()
        conn.close()
        return redirect(url_for('index'))

    conn.close()
    products = get_products()
    units = get_units()
    return render_template('form.html', action="Editar", item=item, products=products, units=units)

@app.route('/delete/<int:item_id>', methods=['POST'])
def delete(item_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM BASE_COTATION WHERE id=?", (item_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))


@app.route('/email_db')
def email_list():
    conn = get_db_connection()
    items = conn.execute("SELECT * FROM email_db ORDER BY id ASC").fetchall()
    conn.close()
    return render_template('email_list.html', items=items)

@app.route('/email_db/add', methods=['GET', 'POST'])
def add_email():
    if request.method == 'POST':
        comprador = request.form['comprador']
        email = request.form['email'] or None

        conn = get_db_connection()
        conn.execute("INSERT INTO email_db (comprador, email) VALUES (?, ?)", (comprador, email))
        conn.commit()
        conn.close()
        return redirect(url_for('email_list'))

    return render_template('email_form.html', action="Adicionar", item=None)

@app.route('/email_db/edit/<int:email_id>', methods=['GET', 'POST'])
def edit_email(email_id):
    conn = get_db_connection()
    item = conn.execute("SELECT * FROM email_db WHERE id = ?", (email_id,)).fetchone()

    if request.method == 'POST':
        comprador = request.form['comprador']

        email = request.form['email'] or None

        conn.execute("UPDATE email_db SET comprador=?, email=? WHERE id=?", (comprador, email, email_id))
        conn.commit()
        conn.close()
        return redirect(url_for('email_list'))

    conn.close()
    return render_template('email_form.html', action="Editar", item=item)

@app.route('/email_db/delete/<int:email_id>', methods=['POST'])
def delete_email(email_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM email_db WHERE id=?", (email_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('email_list'))

app.config['TEMPLATES_AUTO_RELOAD'] = True
if __name__ == '__main__':
    app.run(debug=True)
