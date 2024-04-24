///
// choosing an element on the page
///

function removeAncestorsClass(node) {
  if (node.classList) {
    node.classList.remove('wscsv-hover');
  }

  const { parentNode } = node;
  if (parentNode && parentNode.classList && parentNode.classList.contains('wscsv-hover')) {
    removeAncestorsClass(parentNode);
  }
}

function chooseMouseover(e) {
  const node = e.target;
  node.classList.add('wscsv-hover');
  removeAncestorsClass(node.parentNode);
}

function chooseMouseout(e) {
  removeAncestorsClass(e.target);
}

function chooseClick(e) {
  e.preventDefault();
  e.stopPropagation();
  chooseMouseout(e);

  document.body.classList.remove('wscsv-choose');
  document.removeEventListener('mouseover', chooseMouseover);
  document.removeEventListener('mouseout', chooseMouseout);
}

// init choose UI. resolves with chosen element
export default function chooseEl(label) {
  // TODO: if there's a saved selector for label skip this step
  // TODO: instructions with label
  document.body.classList.add('wscsv-choose');
  document.addEventListener('mouseover', chooseMouseover);
  document.addEventListener('mouseout', chooseMouseout);

  return new Promise((resolve) => {
    document.addEventListener('click', (e) => {
      chooseClick(e);
      resolve(e.target);
    }, { once: true, capture: true });
  });
}
