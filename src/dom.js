///
// working with DOM elements
///

// is the node a descendent of the parentNode? (or is parentNode itself)
function isDescendant(node, parentNode) {
  if (!node || !parentNode) {
    return false;
  }
  if (node === parentNode) {
    return true;
  }
  return isDescendant(node.parentNode, parentNode);
}

// find where the specified nodes converge as siblings
function closestSiblings(nodeA, nodeB) {
  const parentA = nodeA.parentNode;
  const parentB = nodeB.parentNode;
  if (parentA === parentB) {
    return [nodeA, nodeB];
  }

  // TODO: account for asymmetrical tree: check if parentA contains nodeB (and reverse) - if so
  // we're at the common ancestor and can just go up from nodeB until its parentNode is parentA
  // if (isDescendant(nodeB, parentA)) {

  // }

  return closestSiblings(parentA, parentB);
}

// for each heading, recurse up to the common parent of the next heading. related data is nodes
// between the headings
export function dataBetweenHeadings(heading, i, list) {
  const nextHeading = list[i + 1];
  if (!nextHeading) {
    // leftover data will be assigned to last heading
    return { heading };
  }

  const siblings = closestSiblings(heading, nextHeading);
  let groupA = siblings[0];
  const groupB = siblings[1];

  const containers = [];
  while (groupA && groupA !== groupB) {
    if (groupA !== heading && groupA.hasChildNodes()) {
      containers.push(groupA);
    }
    groupA = groupA.nextSibling;
  }
  return { heading, containers };
}

// find the data group in which the node is a descendent of one of its containers. put the node in
// the data group, in an array on a key specified by label
export function assignToHeading(data, label, node) {
  const group = data.find(({ containers }) => {
    if (!containers) {
      // leftover data assigned to last heading
      return true;
    }
    return containers.find((parentNode) => isDescendant(node, parentNode));
  });

  if (!group) {
    return;
  }

  if (group[label]) {
    group[label].push(node);
  } else {
    group[label] = [node];
  }
}
