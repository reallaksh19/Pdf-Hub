with open('frontend/src/components/shell/StatusBar.tsx', 'r') as f:
    content = f.read()

content = content.replace("""    if (!isNaN(parsed) && parsed >= 1 && parsed <= pageCount) {
      setPage(parsed);
      setVisiblePage(parsed);
      setInputValue(parsed.toString());

    setIsEditingPage(false);
  };""", """    if (!isNaN(parsed) && parsed >= 1 && parsed <= pageCount) {
      setPage(parsed);
      setVisiblePage(parsed);
      setInputValue(parsed.toString());
    } else {
      setInputValue(visiblePage.toString());
    }
    setIsEditingPage(false);
  };""")

with open('frontend/src/components/shell/StatusBar.tsx', 'w') as f:
    f.write(content)
