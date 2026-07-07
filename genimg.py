from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import math
exec(open('/tmp/nsis/gen.py').read().split('# ---------- SIDEBAR')[0])  # helpers: vgrad, glow, logo, diamond...

F_B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F_R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def rounded_bg(w,h,rad,top,bot):
    img=vgrad(w,h,top,bot).convert('RGBA')
    mask=Image.new('L',(w,h),0)
    d=ImageDraw.Draw(mask)
    d.rounded_rectangle([0,0,w-1,h-1],radius=rad,fill=255)
    out=Image.new('RGBA',(w,h),(0,0,0,0))
    out.paste(img,(0,0),mask)
    return out

# ============ LOGO: iPhone Orientation Fix ============
def iphone_logo(size=256):
    img=rounded_bg(size,size,int(size*0.22),(20,24,31),(10,12,16))
    glow(img,int(size*0.25),int(size*0.2),int(size*0.45),ACID,26)
    glow(img,int(size*0.8),int(size*0.85),int(size*0.5),PURPLE,30)
    d=ImageDraw.Draw(img)
    # telefono vertical (fantasma, violeta)
    pw,ph=int(size*0.28),int(size*0.5)
    px,py=int(size*0.20),int(size*0.25)
    d.rounded_rectangle([px,py,px+pw,py+ph],radius=int(pw*0.22),outline=PURPLE+(150,),width=int(size*0.028))
    # telefono horizontal (acid, protagonista)
    hw,hh=int(size*0.5),int(size*0.28)
    hx,hy=int(size*0.36),int(size*0.47)
    sh=Image.new('RGBA',img.size,(0,0,0,0))
    ds=ImageDraw.Draw(sh)
    ds.rounded_rectangle([hx,hy,hx+hw,hy+hh],radius=int(hh*0.22),outline=ACID+(255,),width=int(size*0.034))
    gl=sh.filter(ImageFilter.GaussianBlur(size*0.03))
    img.alpha_composite(Image.blend(Image.new('RGBA',img.size,(0,0,0,0)),gl,0.7))
    img.alpha_composite(sh)
    # flecha de rotacion (arco)
    ar=int(size*0.30)
    cx,cy=int(size*0.56),int(size*0.40)
    arc=Image.new('RGBA',img.size,(0,0,0,0))
    da=ImageDraw.Draw(arc)
    da.arc([cx-ar,cy-ar,cx+ar,cy+ar],start=-150,end=-40,fill=(226,255,122,255),width=int(size*0.030))
    # punta de flecha
    ang=math.radians(-40)
    tipx,tipy=cx+ar*math.cos(ang),cy+ar*math.sin(ang)
    da.polygon([(tipx+size*0.012,tipy-size*0.03),(tipx+size*0.05,tipy+size*0.012),(tipx-size*0.035,tipy+size*0.025)],fill=(226,255,122,255))
    img.alpha_composite(arc)
    return img

iphone_logo(256).save('/tmp/mkt/plugins/iphone-orientation-fix/logo.png')

# ============ LOGO: ClipDock Remote (logo ClipDock) ============
def clipdock_logo_img(size=256):
    img=rounded_bg(size,size,int(size*0.22),(20,24,31),(10,12,16))
    glow(img,int(size*0.28),int(size*0.24),int(size*0.5),ACID,24)
    glow(img,int(size*0.78),int(size*0.82),int(size*0.55),PURPLE,30)
    lg=logo(int(size*0.72))
    img.alpha_composite(lg,((size-lg.size[0])//2,(size-lg.size[1])//2))
    return img

clipdock_logo_img(256).save('/tmp/mkt/plugins/clipdock-remote-adobe/logo.png')

# ============ BANNERS 800x360 ============
def banner_base(title,subtitle,accent_side='left'):
    W,H=800,360
    img=vgrad(W,H,(16,19,25),(9,11,15)).convert('RGBA')
    glow(img,120,60,220,ACID,20)
    glow(img,700,320,260,PURPLE,26)
    d=ImageDraw.Draw(img,'RGBA')
    return img,d

# Banner iPhone Orientation Fix: linea de tiempo con clips rotando
W,H=800,360
img,d=banner_base('','')
# timeline abajo
ty=270
d.rounded_rectangle([40,ty,760,ty+44],radius=10,fill=(20,25,32,235),outline=(45,52,64,255))
for i,(x,w,c) in enumerate([(52,120,(201,255,61,70)),(180,90,(154,136,255,70)),(278,150,(201,255,61,50)),(436,110,(154,136,255,60)),(554,120,(201,255,61,60)),(682,66,(154,136,255,55))]):
    d.rounded_rectangle([x,ty+7,x+w,ty+37],radius=6,fill=c)
d.line([(300,ty-6),(300,ty+50)],fill=(226,255,122,255),width=3)
# telefonos: vertical fantasma -> horizontal
d.rounded_rectangle([120,60,220,220],radius=22,outline=(154,136,255,140),width=7)
d.rounded_rectangle([300,105,540,220],radius=24,outline=(201,255,61,255),width=9)
d.rounded_rectangle([316,120,524,205],radius=12,fill=(23,29,20,255))
d.polygon([(405,142),(405,184),(444,163)],fill=(201,255,61,230))
# arco de rotacion
arc=Image.new('RGBA',img.size,(0,0,0,0)); da=ImageDraw.Draw(arc)
da.arc([180,40,420,240],start=-130,end=-20,fill=(226,255,122,220),width=8)
da.polygon([(420,96),(438,122),(396,120)],fill=(226,255,122,220))
img.alpha_composite(arc)
# texto
f1=ImageFont.truetype(F_B,34); f2=ImageFont.truetype(F_R,15); f3=ImageFont.truetype(F_B,11)
d=ImageDraw.Draw(img)
d.text((575,96),'iPhone',font=f1,fill=(244,242,236))
d.text((575,134),'Orientation',font=f1,fill=(244,242,236))
d.text((575,172),'Fix',font=f1,fill=(201,255,61))
d.text((576,220),'Rotación por segmentos\ndirecto en Premiere Pro',font=f2,fill=(138,148,161))
d.text((42,34),'P R E M I E R E   P R O   ·   C E P',font=f3,fill=(111,119,130))
img.convert('RGB').save('/tmp/mkt/plugins/iphone-orientation-fix/banner.png')

# Banner ClipDock Remote: rombo + flujo Adobe <-> ClipDock
img,d=banner_base('','')
dia=diamond(150)
img.alpha_composite(dia,(80,42))
lg=logo(84)
img.alpha_composite(lg,(80+(dia.size[0]-84)//2,42+(dia.size[1]-84)//2-4))
# nodo Adobe (cuadro violeta "Pr")
d=ImageDraw.Draw(img)
d.rounded_rectangle([560,120,680,240],radius=24,fill=(28,22,60,255),outline=(94,78,190,255),width=3)
fpr=ImageFont.truetype(F_B,44)
d.text((588,152),'Pr',font=fpr,fill=(185,173,255))
# flechas de conexion
d.line([(320,180),(545,180)],fill=(201,255,61,190),width=5)
d.polygon([(548,180),(524,166),(524,194)],fill=(201,255,61,220))
d.line([(320,205),(545,205)],fill=(154,136,255,150),width=3)
d.polygon([(317,205),(341,193),(341,217)],fill=(154,136,255,180))
f1=ImageFont.truetype(F_B,34)
cw=d.textlength('ClipDock ',font=f1)
d.text((90,278),'ClipDock ',font=f1,fill=(244,242,236))
d.text((90+cw,278),'Remote',font=f1,fill=(201,255,61))
f2=ImageFont.truetype(F_R,15)
d.text((92,322),'Controla ClipDock desde Adobe con una extensión CEP',font=f2,fill=(138,148,161))
f3=ImageFont.truetype(F_B,11)
d.text((42,34),'A D O B E   C E P   ·   O F I C I A L',font=f3,fill=(111,119,130))
img.convert('RGB').save('/tmp/mkt/plugins/clipdock-remote-adobe/banner.png')

print('imagenes OK')
