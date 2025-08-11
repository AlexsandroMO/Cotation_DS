# from flask import Flask, render_template, request, make_response
# from fpdf import FPDF

# app = Flask(__name__)

# @app.route('/')
# def index():
#     return render_template('formulario.html')

# @app.route('/generate_pdf', methods=['POST'])
# def generate_pdf():
#     nome = request.form.get('nome', 'Sem Nome')
#     email = request.form.get('email', 'Sem Email')

#     pdf = FPDF()
#     pdf.add_page()
#     pdf.set_font("Arial", size=16)
#     pdf.cell(200, 10, txt="Formulário enviado", ln=1, align="C")
#     pdf.ln(10)
#     pdf.set_font("Arial", size=12)
#     pdf.cell(200, 10, txt=f"Nome: {nome}", ln=1)
#     pdf.cell(200, 10, txt=f"E-mail: {email}", ln=1)

#     pdf_output = pdf.output(dest='S').encode('latin1')  # gerar PDF em memória

#     response = make_response(pdf_output)
#     response.headers.set('Content-Type', 'application/pdf')
#     response.headers.set('Content-Disposition', 'attachment', filename='formulario.pdf')
#     return response

# if __name__ == '__main__':
#     app.run(debug=True)




# from flask import Flask, render_template
# import sqlite3

# app = Flask(__name__)

# def get_products():
#     conn = sqlite3.connect('cotation.db')
#     cursor = conn.cursor()
#     cursor.execute("SELECT product FROM BASE_COTATION ORDER BY product")
#     rows = cursor.fetchall()
#     conn.close()
#     # Usar set para eliminar duplicados, depois ordenar
#     unique_products = sorted(set(row[0] for row in rows))
#     return unique_products

# @app.route('/')
# def index():
#     products = get_products()
#     return render_template('index.html', products=products)

# if __name__ == '__main__':
#     app.run(debug=True)


from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)


def get_products():
    conn = sqlite3.connect('cotation.db')
    cursor = conn.cursor()
    cursor.execute("SELECT product FROM BASE_COTATION ORDER BY product")
    rows = cursor.fetchall()
    conn.close()
    # Elimina duplicados e ordena
    unique_products = sorted(set(row[0] for row in rows))
    return unique_products

def get_units():
    conn = sqlite3.connect('cotation.db')
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

    conn = sqlite3.connect('cotation.db')
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

@app.route('/')
def index():
    products = get_products()  # sua função já existente para produtos
    units = get_units()        # nova função para unidades
    return render_template('index.html', products=products, units=units)

if __name__ == '__main__':

    app.run(debug=True)




