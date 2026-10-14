"""Regenerate the preloaded hero subset after changing HERO_HEADLINE (requires fontTools)."""
from pathlib import Path
import re
from fontTools import subset

root = Path(__file__).resolve().parent.parent
source = (root / 'src/components/OpenBarreLanding.tsx').read_text()
headline = re.search(r'const HERO_HEADLINE = "([^"]+)";', source).group(1)
options = subset.Options()
options.flavor = 'woff2'
options.desubroutinize = True
font = subset.load_font(str(root / 'public/fonts/instrument-serif.woff2'), options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=headline)
subsetter.subset(font)
for record in font['name'].names:
    if record.nameID in (1, 2, 4, 6):
        value = 'Regular' if record.nameID == 2 else ('P57HeroSerif-Regular' if record.nameID == 6 else 'P57 Hero Serif')
        record.string = value.encode(record.getEncoding(), errors='replace')
subset.save_font(font, str(root / 'public/fonts/hero-serif.woff2'), options)
