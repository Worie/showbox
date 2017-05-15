const PACKAGE_NAME = 'showbox';
const _mapValues = (obj, cb) => {
  Object.keys(obj).forEach( key => {
    obj[key] = cb(obj[key], key);
  });
  
  return obj;
};

// default color set, move
let config = {
  "borderColor": "rgba(255, 239, 137, 0.74)",
  "marginStyling": {
    "background-color": "rgba(242, 147, 19, 0.79)"
  },
  "paddingStyling": {
    "background-color": "rgba(116, 204, 77, 0.55)"
  }
};

// animation, later
var req, timeout;
var animateHighlight = function (time) {
    if(req) {
        window.cancelAnimationFrame(req);	
        window.clearTimeout(timeout);
    }
    req = window.requestAnimationFrame(redrawHighlights);

    timeout = setTimeout(function () {
        window.cancelAnimationFrame(req);	
        req = null;
    }, time * 1000);
};

// simplify
const createBoxModel = options => {
  let props = getObjectProperties(options.node);
  
  if (!canBeHighlighted(props)) {
    return;
  }
  
  ({ width, height, offset, computed } = props);  
  
  let highlightEl = document.createElement('div');
  
  highlightEl.setAttribute(`data-${PACKAGE_NAME}-type`,'highlight');
  
  let _createVisualizationEls = options => {
    ({obj, type, cb, styling} = options);
    
    Object.keys(obj).forEach( side => {
      // Generate the styles for element on each side via cb function
      // And add user config to it
      let styles = Object.assign(cb(props, side), styling);
      
      
      let createdEl = createElement(styles);
      
      createdEl.setAttribute(`data-${PACKAGE_NAME}-type`, type);
      createdEl.setAttribute(`data-${PACKAGE_NAME}-side`, side);
      
      createdEl.style.willChange = "transform";
      
      highlightEl.appendChild(createdEl);
    });
  };
  
  _createVisualizationEls({
    type: 'padding',
    obj: props.padding,
    cb: paddingRectStyling,
    styling: config.paddingStyling
  });
  
  _createVisualizationEls({
    type: 'margin',
    obj: props.margin,
    cb: marginRectStyling,
    styling: config.marginStyling
  });
  
  const COMPUTED = Symbol('computed property');
  
  let mainBoxStyles = {
    "left": 0,
    "top": 0,
    "width": `${ width }px`,
    "height": `${ height }px`,
    // what are the maximum z-index value across browsers
    "margin": 0,
    "padding": 0,
    "position": "absolute",
    "box-sizing": COMPUTED,
    "transform": COMPUTED,
    "transform-origin": COMPUTED,
    "border-right-width": COMPUTED,
    "border-left-width": COMPUTED,
    "border-top-width": COMPUTED,
    "border-bottom-width": COMPUTED,		
    "border-right-style": COMPUTED,		
    "border-left-style": COMPUTED,		
    "border-top-style": COMPUTED,		
    "border-bottom-style": COMPUTED,	
    "border-color": config.borderColor,
    "display": COMPUTED
  };
  
  Object.assign(highlightEl.style, _mapValues(
    mainBoxStyles,
    (v, key) => v === COMPUTED ?
      computed.getPropertyValue(key) : 
      v
  ));
  
  let wrapperEl = document.createElement('div');
  
  const wrapperStyles = {
    "left": `${ offset.left }px`,
    "top": `${ offset.top }px`,
    "z-index": 2000000, //magic number
    "position": 'absolute',
    "pointer-events": "none"
  };
  
  Object.assign(wrapperEl.style, wrapperStyles);
  wrapperEl.appendChild(highlightEl);
  
  
  wrapperEl.setAttribute(`data-${PACKAGE_NAME}-type`, 'wrapper');
  
  document.body.appendChild(wrapperEl);
};

const getObjectProperties = node => {
  let properties = {};  
  let bounds = node.getBoundingClientRect();
  let computed = window.getComputedStyle(node);
  
  const _getAsFloat = propertyName => {
    return parseFloat(computed.getPropertyValue(propertyName));
  };
  
  let transition = {
    duration: _getAsFloat('transition-duration')
  };
  
  let animation = {
    duration: _getAsFloat('animation-duration')
  };
  
  let border = {
    right: _getAsFloat('border-right-width'),
    bottom: _getAsFloat('border-bottom-width'),
    left: _getAsFloat('border-left-width'),
    top: _getAsFloat('border-top-width')
  };
  
  let padding = {
    right: _getAsFloat('padding-right'),
    bottom: _getAsFloat('padding-bottom'),
    left: _getAsFloat('padding-left'),
    top: _getAsFloat('padding-top')
  };
  
  let margin = {
    right: _getAsFloat('margin-right'),
    bottom: _getAsFloat('margin-bottom'),
    left: _getAsFloat('margin-left'),
    top: _getAsFloat('margin-top')    
  };

  let borderBox = computed.boxSizing === 'border-box';
  
  let width = _getAsFloat('width');
  let height = _getAsFloat('height');
  
  let display = _getAsFloat('display');
  
  // If border-box is not applied to the highlighted node,
  // add necessary properties
  if (!borderBox) {
    width += padding.left + padding.right;
    height += padding.top + padding.bottom;
  }
  
  let _getUntransformedOffset = el => {
    let left = 0;
    let top = 0;
    
    do {
     left += el.offsetLeft;		
     top  += el.offsetTop;		
     el = el.offsetParent;		
    } while(el);  
    
    return {
      left: left,
      top: top
    };
  };
  
  var offset = _getUntransformedOffset(node);
  
  return {
    margin: margin,
    padding: padding,
    border: border,
    width: width,
    height: height,
    offset: offset,
    borderBox: borderBox,
    animation: animation,
    transition: transition,
    display: display,
    dataset: node.dataset,
    computed: computed
  };
  
  //reconsider returing computed (is it necessery really?);
};

let createElement = styles => {
  let divEl = document.createElement('div');
  Object.assign(
    divEl.style, 
    styles
  );
  
  return divEl;
};

let getAxisSize = property => {
  return {
    horizontal: property.left + property.right,
    vertical: property.bottom + property.top
  }
};


let paddingVerticalStyling = (props, side) => {
  ({
    padding,
    height,
    border,
    borderBox,
    width
  } = props);
  
  let elWidth = ( borderBox ?
             width - getAxisSize(border)['horizontal'] :
             width);
                           
  return {
    height: `${ padding[side] }px`,
    width: `${ elWidth }px`,
    left: 0,
  };
};

let paddingHorizontalStyling = (props, side) => {
  ({
    padding,
    height,
    border,
    borderBox,
    width
  } = props);
  
  let elHeight = ( borderBox ?
             height - getAxisSize(border)['vertical'] :
             height);
  elHeight -= getAxisSize(padding)['vertical'];
                                                                                               
  return {
    height: `${ elHeight }px`,
    width: `${ padding[side] }px`,
    top: `${ padding.top }px`,
  };  
};

let paddingRectStyling = (props, side) => { 

  const obj = {};
  
  if (/[rl]/.test(side)) {
    Object.assign(obj, paddingHorizontalStyling(props, side));
  } else {
    Object.assign(obj, paddingVerticalStyling(props, side));
  }

  const commonStyling = {
    position: 'absolute'
  };
  commonStyling[side] = 0;

  Object.assign(obj, commonStyling);
  return obj;  
};


let marginHorizontalRectStyling = (props, side) => {
  ({
    margin,
    height,
    borderBox
  } = props);
                                                                                               
  const elHeight = (borderBox ? 
                    height :
                    height + getAxisSize(border)['vertical']
                   );
  return {
    width: `${ margin[side] }px`,
    height: `${ elHeight }px`,
    top: `${ - border.top }px`
  };
};

let marginVerticalRectStyling = (props, side) => {
  ({
    margin,
    height
  } = props);
  
  let elWidth = (borderBox ? 
                   width :
                   width + getAxisSize(border)['horizontal']
                  );
  elWidth += getAxisSize(margin)['horizontal'];
                                                                                               
  return {
    height: `${ margin[side] }px`,
    width: `${ elWidth }px`,
    left: `${ - border.left - margin.left }px`
  };
};

let marginRectStyling = (props, side) => {
  ({ display } = props);
  const obj = {};
  if (/[rl]/.test(side)) {
    Object.assign(obj, marginHorizontalRectStyling(props, side));
  } else {
    Object.assign(obj, marginVerticalRectStyling(props, side));
  }

  const commonStyling = {
    position: 'absolute'
  };
  commonStyling[side] = `${-(margin[side] + border[side])}px`;


  Object.assign(obj, commonStyling);
  
  return obj;
};

let canBeHighlighted = props => {
  ({
    display,
    width,
    height,
    dataset
  } = props);
  
  
  if (display === 'none' || width === 0 || height === 0)
    return false;
  
  const regex = new RegExp(PACKAGE_NAME);
  
  return !Object.keys(dataset).some(key => {
    return regex.test(key);
  });
};
