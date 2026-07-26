# 通用解码：解码 yhhy 收件箱里最新的 .md（GBK 乱码修复）
import glob, os

base = r'C:\Users\Administrator\.qclaw\media\inbound'
files = glob.glob(os.path.join(base, '*.md')) + glob.glob(os.path.join(base, '*.txt'))
if not files:
    print('inbound 没有 .md 文件')
else:
    newest = max(files, key=os.path.getmtime)
    raw = open(newest, 'rb').read()
    txt = None
    for enc in ['gb18030', 'gbk', 'utf-8-sig', 'utf-8']:
        try:
            txt = raw.decode(enc)
            print('用', enc, '解码成功')
            break
        except Exception as e:
            print('fail', enc, e)
    out = r'C:\Users\Administrator\.qclaw\workspace\yhhy\_last_decode.txt'
    open(out, 'w', encoding='utf-8').write(txt)
    print('已写出到', out)
    print('==== 内容 ====')
    print(txt)
