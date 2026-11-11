const destination = new URL("stickerbanner/",location.href);
destination.search = location.search;
destination.hash = location.hash;
location.replace(destination.href);
