with open("frontend/src/components/inspector/InspectorPanel.tsx", "r") as f:
    content = f.read()

# Fix imports in InspectorPanel
import_stmt = "import { Settings, Palette, Info, ChevronRight, ChevronLeft, MessageSquare, Send } from 'lucide-react';"
new_import = "import { Settings, Palette, Info, ChevronRight, ChevronLeft, MessageSquare, Send, AlignLeft, AlignCenter, AlignRight, Bold, Type } from 'lucide-react';"
content = content.replace(import_stmt, new_import)

with open("frontend/src/components/inspector/InspectorPanel.tsx", "w") as f:
    f.write(content)
