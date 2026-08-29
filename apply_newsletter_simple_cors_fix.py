from pathlib import Path

p = Path('js/components/Footer.js')
s = p.read_text(encoding='utf-8')
old = "headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({email})"
new = "headers:{Accept:'application/json'},body:JSON.stringify({email})"
if old not in s:
    if new in s:
        print('Newsletter request already uses a CORS-simple request')
    else:
        raise SystemExit('Newsletter fetch signature not found')
else:
    s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('Newsletter request changed to CORS-simple JSON body (no application/json preflight)')
