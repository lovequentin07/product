#!/usr/bin/env bash
GLIB=$(find /nix/store -maxdepth 3 -name "libglib-2.0.so.0" 2>/dev/null | head -1 | xargs dirname)
NSPR=$(find /nix/store -maxdepth 4 -name "libnspr4.so" 2>/dev/null | head -1 | xargs dirname)
NSS=$(find /nix/store -maxdepth 4 -name "libnss3.so" 2>/dev/null | head -1 | xargs dirname)
ATK=$(find /nix/store -maxdepth 4 -name "libatk-1.0.so.0" 2>/dev/null | head -1 | xargs dirname)
ATK2=$(find /nix/store -maxdepth 4 -name "libatk-bridge-2.0.so.0" 2>/dev/null | head -1 | xargs dirname)
DBUS=$(find /nix/store -maxdepth 4 -name "libdbus-1.so.3" 2>/dev/null | head -1 | xargs dirname)
EXPAT=$(find /nix/store -maxdepth 4 -name "libexpat.so.1" 2>/dev/null | head -1 | xargs dirname)
X11=$(find /nix/store -maxdepth 4 -name "libX11.so.6" 2>/dev/null | head -1 | xargs dirname)
XEXT=$(find /nix/store -maxdepth 4 -name "libXext.so.6" 2>/dev/null | head -1 | xargs dirname)
XCB=$(find /nix/store -maxdepth 4 -name "libxcb.so.1" 2>/dev/null | head -1 | xargs dirname)
GBM=$(find /nix/store -maxdepth 4 -name "libgbm.so.1" 2>/dev/null | head -1 | xargs dirname)
XKB=$(find /nix/store -maxdepth 4 -name "libxkbcommon.so.0" 2>/dev/null | head -1 | xargs dirname)
UDEV=$(find /nix/store -maxdepth 4 -name "libudev.so.1" 2>/dev/null | head -1 | xargs dirname)
ALSA=$(find /nix/store -maxdepth 4 -name "libasound.so.2" 2>/dev/null | head -1 | xargs dirname)
XDAM=$(find /nix/store -maxdepth 4 -name "libXdamage.so.1" 2>/dev/null | head -1 | xargs dirname)
XFIX=$(find /nix/store -maxdepth 4 -name "libXfixes.so.3" 2>/dev/null | head -1 | xargs dirname)
XRAN=$(find /nix/store -maxdepth 4 -name "libXrandr.so.2" 2>/dev/null | head -1 | xargs dirname)
XCOM=$(find /nix/store -maxdepth 4 -name "libXcomposite.so.1" 2>/dev/null | head -1 | xargs dirname)

export LD_LIBRARY_PATH="$GLIB:$NSPR:$NSS:$ATK:$ATK2:$DBUS:$EXPAT:$X11:$XEXT:$XCB:$GBM:$XKB:$UDEV:$ALSA:$XDAM:$XFIX:$XRAN:$XCOM"
exec node scrape-coupang.js
