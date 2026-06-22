#!/usr/bin/env python3
"""Generate BUMDESMart Class Diagram PDF — A2 Landscape"""
import math
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A2
from reportlab.lib.colors import HexColor, white

PAGE_W, PAGE_H = landscape(A2)   # 1683.78 x 1190.55 pt
MARGIN    = 35
TITLE_H   = 30
LEGEND_H  = 20

VP_W, VP_H = 1900, 1060

AVAIL_W = PAGE_W - 2 * MARGIN
AVAIL_H = PAGE_H - MARGIN - TITLE_H - LEGEND_H - MARGIN

S  = min(AVAIL_W / VP_W, AVAIL_H / VP_H) * 0.97
CW = 215 * S
LH = 15.5 * S
HH = 26  * S

AF = 6.8    # attribute/method font size (pt)
HF = 8.5    # header font size

DC = {
    'auth':     HexColor('#6366f1'),
    'umkm':     HexColor('#059669'),
    'product':  HexColor('#d97706'),
    'order':    HexColor('#dc2626'),
    'payment':  HexColor('#7c3aed'),
    'promo':    HexColor('#db2777'),
    'shipping': HexColor('#0891b2'),
}
DL = {
    'auth':'Auth', 'umkm':'UMKM', 'product':'Produk',
    'order':'Order', 'payment':'Payment', 'promo':'Promosi', 'shipping':'Pengiriman',
}

def px(x): return MARGIN + x * S
def py(y): return PAGE_H - MARGIN - TITLE_H - LEGEND_H - y * S

CLASSES = [
  {'n':'User','x':30,'y':40,'d':'auth',
   'a':['id: bigint PK','name: string','email: string UK','password: string?',
        'google_id: string?','role: enum','phone: string?','avatar: string?','status: enum'],
   'm':['umkmProfile(): HasOne','customer(): HasOne','orderHistories(): HasMany']},
  {'n':'Customer','x':30,'y':282,'d':'auth',
   'a':['id: bigint PK','user_id: bigint FK','name: string','date_of_birth: date?',
        'gender: enum?','avatar: string?','phone: string?'],
   'm':['user(): BelongsTo','addresses(): HasMany','orders(): HasMany','wishlists(): HasMany']},
  {'n':'Address','x':30,'y':510,'d':'auth',
   'a':['id: bigint PK','customer_id: bigint FK','label: string?','recipient_name: string',
        'phone: string','address_line: string','city: string','province: string',
        'postal_code: varchar(10)','is_default: boolean'],
   'm':['customer(): BelongsTo','orders(): HasMany']},
  {'n':'UmkmProfile','x':290,'y':40,'d':'umkm',
   'a':['id: bigint PK','user_id: bigint FK UK','shop_name: string','slug: string UK',
        'owner_name: string','email: string?','phone: string?','logo: string?',
        'banner: string?','npwp: varchar(20)?','nib: varchar(20)?','status: enum',
        'verified_by: bigint FK?','verified_at: datetime?'],
   'm':['user(): BelongsTo','verifiedBy(): BelongsTo','documents(): HasMany',
        'products(): HasMany','orders(): HasMany','promotions(): HasMany']},
  {'n':'UmkmDocument','x':290,'y':416,'d':'umkm',
   'a':['id: bigint PK','umkm_profile_id: bigint FK','document_type: enum',
        'document_number: string?','file_path: string','notes: text?',
        'expired_at: date?','status: enum','verified_by: bigint FK?','verified_at: datetime?'],
   'm':['umkmProfile(): BelongsTo','verifiedBy(): BelongsTo']},
  {'n':'Category','x':555,'y':40,'d':'product',
   'a':['id: bigint PK','parent_id: bigint FK?','name: string','slug: string UK',
        'description: text?','image: string?','sort_order: int','is_active: boolean'],
   'm':['parent(): BelongsTo','children(): HasMany','products(): HasMany']},
  {'n':'Product','x':555,'y':268,'d':'product',
   'a':['id: bigint PK','umkm_profile_id: bigint FK','category_id: bigint FK',
        'name: string','slug: string UK','description: text','price: decimal(15,2)',
        'stock: int','weight: int (gr)','has_variant: boolean','is_digital: boolean',
        'sold_count: int','status: enum'],
   'm':['umkmProfile(): BelongsTo','category(): BelongsTo','images(): HasMany',
        'variants(): HasMany','documents(): HasMany','wishlists(): HasMany']},
  {'n':'Wishlist','x':555,'y':636,'d':'product',
   'a':['id: bigint PK','customer_id: bigint FK','product_id: bigint FK'],
   'm':['customer(): BelongsTo','product(): BelongsTo']},
  {'n':'ProductImage','x':825,'y':40,'d':'product',
   'a':['id: bigint PK','product_id: bigint FK','file_path: string',
        'is_primary: boolean','sort_order: int'],
   'm':['product(): BelongsTo']},
  {'n':'ProductDocument','x':825,'y':190,'d':'product',
   'a':['id: bigint PK','product_id: bigint FK','document_type: string',
        'document_number: string?','issuer: string?','file_path: string',
        'issued_at: date?','expired_at: date?','status: enum'],
   'm':['product(): BelongsTo']},
  {'n':'ProductVariant','x':825,'y':418,'d':'product',
   'a':['id: bigint PK','product_id: bigint FK','name: string','sort_order: int'],
   'm':['product(): BelongsTo','options(): HasMany']},
  {'n':'ProductVariantOption','x':825,'y':556,'d':'product',
   'a':['id: bigint PK','product_variant_id: bigint FK','value: string',
        'sku: string? UK','price: decimal(15,2)','stock: int','weight: int?',
        'is_active: boolean','sort_order: int'],
   'm':['productVariant(): BelongsTo']},
  {'n':'Order','x':1100,'y':40,'d':'order',
   'a':['id: bigint PK','customer_id: bigint FK','umkm_profile_id: bigint FK',
        'address_id: bigint FK','promotion_id: bigint FK?','order_code: string UK',
        'sub_total: decimal(15,2)','shipping_cost: decimal(15,2)',
        'discount: decimal(15,2)','total: decimal(15,2)','status: enum','notes: text?'],
   'm':['customer(): BelongsTo','umkmProfile(): BelongsTo','address(): BelongsTo',
        'promotion(): BelongsTo','items(): HasMany','histories(): HasMany',
        'payment(): HasOne','shipment(): HasOne']},
  {'n':'OrderItem','x':1100,'y':422,'d':'order',
   'a':['id: bigint PK','order_id: bigint FK','product_id: bigint FK',
        'variant_option_id: bigint FK?','product_name: string',
        'product_price: decimal(15,2)','quantity: int','sub_total: decimal(15,2)'],
   'm':['order(): BelongsTo','product(): BelongsTo','variantOption(): BelongsTo']},
  {'n':'OrderHistory','x':1100,'y':662,'d':'order',
   'a':['id: bigint PK','order_id: bigint FK','user_id: bigint FK',
        'status: string','description: text?'],
   'm':['order(): BelongsTo','user(): BelongsTo']},
  {'n':'Payment','x':1375,'y':40,'d':'payment',
   'a':['id: bigint PK','order_id: bigint FK UK','xendit_invoice_id: string? UK',
        'xendit_external_id: string UK','payment_code: string UK','channel: enum?',
        'channel_code: string?','amount: decimal(15,2)','fee_amount: decimal(15,2)',
        'xendit_data: json?','status: enum','paid_at: datetime?',
        'expired_at: datetime?','refunded_at: datetime?'],
   'm':['order(): BelongsTo','details(): HasMany']},
  {'n':'PaymentDetail','x':1375,'y':362,'d':'payment',
   'a':['id: bigint PK','payment_id: bigint FK','key: string','value: text'],
   'm':['payment(): BelongsTo']},
  {'n':'Promotion','x':1375,'y':508,'d':'promo',
   'a':['id: bigint PK','umkm_profile_id: bigint FK','code: string UK','name: string',
        'description: text?','type: enum','value: decimal(15,2)',
        'min_order_amount: decimal?','max_discount_amount: decimal?',
        'start_date: datetime','end_date: datetime','usage_limit: int?',
        'usage_count: int','status: enum'],
   'm':['umkmProfile(): BelongsTo','promotionProducts(): HasMany','orders(): HasMany']},
  {'n':'PromotionProduct','x':1375,'y':856,'d':'promo',
   'a':['id: bigint PK','promotion_id: bigint FK','product_id: bigint FK?','category_id: bigint FK?'],
   'm':['promotion(): BelongsTo','product(): BelongsTo','category(): BelongsTo']},
  {'n':'ShippingService','x':1650,'y':40,'d':'shipping',
   'a':['id: bigint PK','courier_code: string','service_code: string','name: string',
        'description: text?','estimated_days: string?','is_active: boolean'],
   'm':['shipments(): HasMany']},
  {'n':'Shipment','x':1650,'y':230,'d':'shipping',
   'a':['id: bigint PK','order_id: bigint FK UK','shipping_service_id: bigint FK',
        'tracking_number: string? UK','weight: int?','shipping_cost: decimal(15,2)',
        'status: enum','notes: text?','shipped_at: datetime?',
        'estimated_delivery_at: datetime?','delivered_at: datetime?'],
   'm':['order(): BelongsTo','shippingService(): BelongsTo','trackings(): HasMany']},
  {'n':'ShipmentTracking','x':1650,'y':524,'d':'shipping',
   'a':['id: bigint PK','shipment_id: bigint FK','status: string','location: string?',
        'notes: text','event_time: datetime'],
   'm':['shipment(): BelongsTo']},
]

CM = {c['n']: c for c in CLASSES}

EDGES = [
  ('User','UmkmProfile','1'), ('User','Customer','1'),
  ('Customer','Address','*'), ('Customer','Order','*'), ('Customer','Wishlist','*'),
  ('UmkmProfile','UmkmDocument','*'), ('UmkmProfile','Product','*'),
  ('UmkmProfile','Order','*'), ('UmkmProfile','Promotion','*'),
  ('Address','Order','*'), ('Promotion','Order','*'),
  ('Category','Product','*'),
  ('Product','ProductImage','*'), ('Product','ProductDocument','*'),
  ('Product','ProductVariant','*'), ('Product','Wishlist','*'),
  ('ProductVariant','ProductVariantOption','*'),
  ('Order','OrderItem','*'), ('Order','OrderHistory','*'),
  ('Order','Payment','1'), ('Order','Shipment','1'),
  ('OrderItem','ProductVariantOption','0..1'),
  ('Payment','PaymentDetail','*'),
  ('Shipment','ShippingService','1'), ('Shipment','ShipmentTracking','*'),
  ('Promotion','PromotionProduct','*'),
]

def bh_vp(cls):
    return 26 + (len(cls['a']) + len(cls['m'])) * 15.5 + 10

def center_vp(cls):
    h = bh_vp(cls)
    return (cls['x'] + 107.5, cls['y'] + h / 2)

def port_vp(cls, side):
    h = bh_vp(cls)
    cx = cls['x'] + 107.5
    cy = cls['y'] + h / 2
    if side == 'r': return (cls['x'] + 215, cy)
    if side == 'l': return (cls['x'], cy)
    if side == 'b': return (cx, cls['y'] + h)
    return (cx, cls['y'])

def choose_sides(fn, tn):
    fc = center_vp(CM[fn]); tc = center_vp(CM[tn])
    dx, dy = tc[0] - fc[0], tc[1] - fc[1]
    if abs(dx) >= abs(dy):
        return ('r', 'l') if dx > 0 else ('l', 'r')
    return ('b', 't') if dy > 0 else ('t', 'b')

def draw_arrowhead(cv, x2, y2, ox2, oy2, sz=5):
    dx, dy = -ox2, -oy2
    ln = math.sqrt(dx*dx + dy*dy)
    if ln < 0.01: return
    dx /= ln; dy /= ln
    nx, ny = -dy * sz * 0.42, dx * sz * 0.42
    p = cv.beginPath()
    p.moveTo(x2, y2)
    p.lineTo(x2 - dx*sz + nx, y2 - dy*sz + ny)
    p.lineTo(x2 - dx*sz - nx, y2 - dy*sz - ny)
    p.close()
    cv.drawPath(p, fill=1, stroke=0)

def generate():
    out = r'C:\Profesional-Projek\Hibah\BUMDESMart\class_diagram.pdf'
    cv = canvas.Canvas(out, pagesize=(PAGE_W, PAGE_H))

    # Background
    cv.setFillColor(HexColor('#f8fafc'))
    cv.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Title bar
    cv.setFillColor(HexColor('#0f172a'))
    cv.rect(0, PAGE_H - TITLE_H, PAGE_W, TITLE_H, fill=1, stroke=0)
    cv.setFillColor(white)
    cv.setFont('Helvetica-Bold', 13)
    cv.drawString(MARGIN, PAGE_H - TITLE_H + 10, 'BUMDESMart — Class Diagram')
    cv.setFont('Helvetica', 8)
    cv.drawRightString(PAGE_W - MARGIN, PAGE_H - TITLE_H + 10,
        'Database Schema v1.0  |  Laravel 11  |  Sanctum Auth  |  22 Classes  |  Xendit Payment')

    # Legend strip
    lx = MARGIN
    ly = PAGE_H - TITLE_H - LEGEND_H + 5
    for d, lbl in DL.items():
        cv.setFillColor(DC[d])
        cv.roundRect(lx, ly, 9, 9, 1.5, fill=1, stroke=0)
        cv.setFillColor(HexColor('#374151'))
        cv.setFont('Helvetica', 6.5)
        cv.drawString(lx + 12, ly + 1.5, lbl)
        lx += 64

    # Legend key (right side)
    cv.setFont('Helvetica', 6.5)
    cv.setFillColor(HexColor('#b45309'))
    cv.drawRightString(PAGE_W - MARGIN, ly + 1.5, 'PK')
    cv.setFillColor(HexColor('#374151'))
    cv.drawRightString(PAGE_W - MARGIN - 18, ly + 1.5, '= Primary Key   ')
    cv.setFillColor(HexColor('#1d4ed8'))
    cv.drawRightString(PAGE_W - MARGIN - 80, ly + 1.5, 'FK')
    cv.setFillColor(HexColor('#374151'))
    cv.drawRightString(PAGE_W - MARGIN - 98, ly + 1.5, '= Foreign Key   ')
    cv.setFillColor(HexColor('#7c3aed'))
    cv.drawRightString(PAGE_W - MARGIN - 158, ly + 1.5, 'UK')
    cv.setFillColor(HexColor('#374151'))
    cv.drawRightString(PAGE_W - MARGIN - 176, ly + 1.5, '= Unique Key')

    # Separator line
    cv.setStrokeColor(HexColor('#e2e8f0'))
    cv.setLineWidth(0.5)
    cv.line(MARGIN, PAGE_H - TITLE_H - LEGEND_H, PAGE_W - MARGIN, PAGE_H - TITLE_H - LEGEND_H)

    # ── Edges ──────────────────────────────────────────────────────────
    ctrl_ofs = {'r': (1,0), 'l': (-1,0), 'b': (0,-1), 't': (0,1)}

    for fn, tn, mult in EDGES:
        if fn == tn: continue
        s1, s2 = choose_sides(fn, tn)
        vp1 = port_vp(CM[fn], s1)
        vp2 = port_vp(CM[tn], s2)
        x1, y1 = px(vp1[0]), py(vp1[1])
        x2, y2 = px(vp2[0]), py(vp2[1])

        dist = math.sqrt((x2-x1)**2 + (y2-y1)**2)
        d_ctrl = max(20*S, min(60*S, dist * 0.35))

        ox1 = ctrl_ofs[s1][0] * d_ctrl; oy1 = ctrl_ofs[s1][1] * d_ctrl
        ox2 = ctrl_ofs[s2][0] * d_ctrl; oy2 = ctrl_ofs[s2][1] * d_ctrl

        cv.setStrokeColor(HexColor('#cbd5e1'))
        cv.setLineWidth(0.65)
        cv.bezier(x1, y1, x1+ox1, y1+oy1, x2+ox2, y2+oy2, x2, y2)

        cv.setFillColor(HexColor('#94a3b8'))
        draw_arrowhead(cv, x2, y2, ox2, oy2, sz=4.5)

        if mult:
            offs = {'r':(-9,4), 'l':(9,4), 'b':(6,-3), 't':(6,6)}
            mx2, my2 = x2 + offs[s2][0], y2 + offs[s2][1]
            cv.setFillColor(HexColor('#64748b'))
            cv.setFont('Helvetica-Bold', 5.5)
            cv.drawCentredString(mx2, my2, mult)

    # ── Class Boxes ────────────────────────────────────────────────────
    for cls in CLASSES:
        col   = DC[cls['d']]
        bh    = bh_vp(cls) * S
        na    = len(cls['a'])
        x0    = px(cls['x'])
        ytop  = py(cls['y'])      # PDF y of top of box
        ybot  = ytop - bh         # PDF y of bottom

        # Light border/shadow effect
        cv.setFillColor(HexColor('#e2e8f0'))
        cv.roundRect(x0 + 1.5, ybot - 1.5, CW, bh, 3, fill=1, stroke=0)

        # Box body
        cv.setFillColor(white)
        cv.setStrokeColor(col)
        cv.setLineWidth(1.1)
        cv.roundRect(x0, ybot, CW, bh, 3, fill=1, stroke=1)

        # Header bg (rounded top, square bottom)
        cv.setFillColor(col)
        cv.roundRect(x0, ytop - HH, CW, HH, 3, fill=1, stroke=0)
        cv.rect(x0, ytop - HH, CW, HH * 0.5, fill=1, stroke=0)

        # Stereotype
        cv.setFillColor(HexColor('#ffffff88') if True else white)
        cv.setFillColor(HexColor('#ffffffcc'))

        # Class name
        cv.setFillColor(white)
        cv.setFont('Helvetica-Bold', HF)
        cv.drawCentredString(x0 + CW / 2, ytop - HH / 2 - HF * 0.38, cls['n'])

        # Attributes
        aY0 = ytop - HH
        for i, attr in enumerate(cls['a']):
            ay = aY0 - (i + 1) * LH + LH * 0.30
            cv.setFont('Courier', AF)
            if 'PK' in attr:
                fc = HexColor('#b45309')
            elif 'FK' in attr:
                fc = HexColor('#1d4ed8')
            elif 'UK' in attr:
                fc = HexColor('#7c3aed')
            else:
                fc = HexColor('#374151')
            cv.setFillColor(HexColor('#9ca3af'))
            cv.drawString(x0 + 3, ay, '- ')
            cv.setFillColor(fc)
            cv.drawString(x0 + 3 + AF * 1.38, ay, attr)

        # Divider
        div_y = aY0 - na * LH - 1
        cv.setStrokeColor(HexColor('#e2e8f0'))
        cv.setLineWidth(0.4)
        cv.line(x0 + 2, div_y, x0 + CW - 2, div_y)

        # Methods
        mY0 = div_y - 2
        for i, m in enumerate(cls['m']):
            my = mY0 - (i + 1) * LH + LH * 0.30
            cv.setFont('Courier', AF)
            cv.setFillColor(HexColor('#9ca3af'))
            cv.drawString(x0 + 3, my, '+ ')
            cv.setFillColor(HexColor('#4b5563'))
            cv.drawString(x0 + 3 + AF * 1.38, my, m)

    # ── Footer ────────────────────────────────────────────────────────
    cv.setStrokeColor(HexColor('#e2e8f0'))
    cv.setLineWidth(0.5)
    cv.line(MARGIN, MARGIN + 12, PAGE_W - MARGIN, MARGIN + 12)
    cv.setFillColor(HexColor('#94a3b8'))
    cv.setFont('Helvetica', 7)
    cv.drawString(MARGIN, MARGIN + 4,
        'BUMDESMart - Hibah PkM Digital Marketplace UMKM  |  Dzaki  .  Fajar  .  Oki  |  2026-06-20')
    cv.drawRightString(PAGE_W - MARGIN, MARGIN + 4,
        'PK = Primary Key  |  FK = Foreign Key  |  UK = Unique Key  |  ? = Nullable')

    cv.save()
    print('PDF saved:', out)

if __name__ == '__main__':
    generate()
