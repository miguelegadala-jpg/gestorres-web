import json, pathlib
B = pathlib.Path(__file__).parent
body = (B/'src/sprite.html').read_text() + '\n' + (B/'src/main.html').read_text()
title = "Gestorres · Administración de torres y condominios en Santo Domingo"
desc = "Administración profesional, honesta y transparente de torres y condominios en Santo Domingo. Cero comisiones de proveedores, cero recargos y reportes financieros claros. Desde 2008."
ld = {"@context":"https://schema.org","@type":"LocalBusiness","name":"Gestorres","legalName":"Gestión de Torres GM, S.R.L.",
 "description":desc,"url":"https://gestorres.com.do/","email":"info@gestorres.com.do","telephone":"+1-809-566-4863",
 "foundingDate":"2008","image":"https://gestorres.com.do/img/logo-gestorres.png",
 "address":{"@type":"PostalAddress","streetAddress":"Roberto Pastoriza #60, Edificio La Constancia, 2do nivel","addressLocality":"Naco, Santo Domingo","addressCountry":"DO"},
 "areaServed":"Santo Domingo","makesOffer":[{"@type":"Offer","itemOffered":{"@type":"Service","name":n}} for n in ["Administración de condominios","Cobro y depósito bancario de cuotas","Pago de facturas de servicios","Mantenimiento preventivo y correctivo","Compra de suministros","Gestión legal para cobro compulsivo","Contratación y manejo de personal","Presupuesto anual y reportes financieros"]]}
fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">'
meta = f'''<meta name="description" content="{desc}">
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://gestorres.com.do/img/bg-cielo.webp">
<meta property="og:locale" content="es_DO">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'''
scripts = '''<script src="js/app.js" defer></script>
<script src="js/i18n.js" defer></script>'''

full = f'''<!doctype html>
<html lang="es-DO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
{meta}
<link rel="canonical" href="https://gestorres.com.do/">
<link rel="icon" href="img/logo-gestorres.svg">
{fonts}
<link rel="preload" as="image" href="img/logo-gestorres.svg">
<link rel="stylesheet" href="css/styles.css">
</head>
<body>
{body}
{scripts}
</body>
</html>
'''
(B/'index.html').write_text(full)

artifact = f'''<title>Gestorres Web</title>
<meta name="claude:viewport-fit-sides" content="cover">
{meta}
{fonts}
<link rel="stylesheet" href="css/styles.css">
<script>document.documentElement.lang="es-DO";</script>
{body}
{scripts}
'''
(B/'artifact.html').write_text(artifact)

# ---------- Páginas internas ----------
import re
src = (B/'src/main.html').read_text()
head_part = src[:src.index('<main id="main">')]
foot_part = src[src.index('</main>') + len('</main>'):]
def relink(s):
    s = re.sub(r'(<a\b[^>]*\bhref=")#(?!main")', r'\1index.html#', s)
    return s.replace('class="brand" href="index.html#inicio"', 'class="brand" href="index.html"').replace('class="to-top" href="index.html#inicio"', 'class="to-top" href="#inicio"')
PAGES = [
  ("proceso", "src/proceso.html", "Empecemos · Gestorres", "Cambiar de administración es más fácil de lo que parece: visita y diagnóstico, propuesta a la medida, presentación en asamblea y transición ordenada."),
  ("garantias", "src/pages/garantias.html", "Garantías · Gestorres", "Cero comisiones de proveedores, pagos siempre a tiempo y ahorros importantes para su condominio."),
  ("nosotros", "src/pages/nosotros.html", "Nosotros · Gestorres", "Gestión de Torres GM, S.R.L.: administración de torres y condominios en Santo Domingo desde 2008. Misión, visión y valores."),
  ("servicios", "src/pages/servicios.html", "Servicios · Gestorres", "Cobro de cuotas, pago de facturas, mantenimiento, suministros, gestión legal, personal y reportes para su torre."),
  ("transparencia", "src/pages/transparencia.html", "Transparencia · Gestorres", "Presupuesto anual y reportes financieros claros cada mes: estado de resultados, cuentas por cobrar y por pagar, conciliaciones y flujo de caja."),
]
sizes = []
for slug, path, ptitle, pdesc in PAGES:
    pbody = (B/'src/sprite.html').read_text() + '\n' + relink(head_part) + (B/path).read_text() + relink(foot_part)
    page = f'''<!doctype html>
<html lang="es-DO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{ptitle}</title>
<meta name="description" content="{pdesc}">
<meta name="theme-color" content="#ffffff">
<meta property="og:title" content="{ptitle}">
<meta property="og:description" content="{pdesc}">
<meta property="og:locale" content="es_DO">
<link rel="canonical" href="https://gestorres.com.do/{slug}.html">
<link rel="icon" href="img/logo-gestorres.svg">
{fonts}
<link rel="stylesheet" href="css/styles.css">
<style>html,body{{margin:0;background:#fff}}</style>
</head>
<body class="page-{slug}">
{pbody}
{scripts}
</body>
</html>
'''
    (B/f'{slug}.html').write_text(page)
    sizes.append(len(page))
print("ok", len(full), len(artifact), sizes)
