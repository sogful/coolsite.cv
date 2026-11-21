function atlasrecord(keys, values) {
  const record = {};
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null) record[keys[i]] = values[i];
  }
  return record;
}

function atlaspoints(values) {
  const points = [];
  for (let i = 0; i < values.length; i += 2) points.push([values[i], values[i + 1]]);
  return points;
}

function expandatlas(metadata) {
  const {objectKeys: objectkeys, meshKeys: meshkeys, objects, ...properties} = metadata;
  if (!objectkeys) return metadata;
  return {...properties, objects: objects.map(row => {
    const object = atlasrecord(objectkeys, row);
    object.mesh = object.mesh.map(values => {
      const sprite = atlasrecord(meshkeys, values);
      sprite.vertices = atlaspoints(sprite.vertices);
      sprite.uv = atlaspoints(sprite.uv);
      return sprite;
    });
    return object;
  })};
}

function expandorders(metadata) {
  if (!Array.isArray(metadata.objects)) return metadata;
  const objects = {};
  for (const row of metadata.objects) {
    const order = [];
    for (let i = 1; i < row.length; i += 3) {
      order.push({z: row[i], byorder: Boolean(row[i + 1]), order: row[i + 2]});
    }
    objects[row[0]] = order;
  }
  return {...metadata, objects};
}
