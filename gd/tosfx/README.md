# Song to SFX

The browser page is served by the local GDGen bridge. Start it with the GDGen
Python environment and open `http://127.0.0.1:8765/`. Uploaded audio stays in
memory or a temporary directory and is removed after conversion.

After conversion, download the `.gmd` level and either:

- Choose **Save to a folder**, then select the GeometryDash save folder in the
  browser's permission picker. Existing `s<ID>.ogg` files are left untouched.
- Choose **Download SFX ZIP**, then extract the included `s<ID>.ogg` files into
  `C:\Users\Admin\AppData\Local\GeometryDash` or another game save folder.

Folder access uses the browser File System Access API, which is only available
in supported browsers and requires an explicit folder selection. If access is
unavailable or denied, the page automatically prepares the complete ZIP. A
static copy of this page cannot convert audio or retrieve local SFX; use the
local bridge for those operations.
