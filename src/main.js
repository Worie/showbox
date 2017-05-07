
// default color set, move
let config = {
  "animateEndValue": {
    "background-color": "rgba(138, 182, 243, 0.83)",
    opacity: 0.7
  },
  "animateStartValue": {
    "background-color": "rgba(0, 162, 255, 0.5)",

  },
  "borderColor": "rgba(255, 239, 137, 0.74)",
  "marginStyling": {
    "background-color": "rgba(242, 147, 19, 0.79)",
    opacity: 0.7
  },
  "paddingStyling": {
    "background-color": "rgb(116, 204, 77)",
    opacity: 0.7
  },
  "showPaddingMargin": true
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
  ({ innerWidth, innerHeight, offset, computed } = props);  
  
  let div = document.createElement('div');
  
  let _createVisualizationEls = function (options) {
    ({type, cb, styling} = options);
    for (let side in type) {
      let styles = Object.assign(cb(props, side), styling);
      let obj = Object.assign(
        {},
        options,
        { styles: styles}
      );

      div.appendChild(
        createElement(obj)
      );
    };
  };
  
  _createVisualizationEls({
    type: props.padding,
    cb: paddingRectStyling,
    styling: config.paddingStyling
  });
  
  _createVisualizationEls({
    type: props.margin,
    cb: marginRectStyling,
    styling: config.marginStyling
  });
  
  let mainBoxStyles = {
    "left": `${ offset.left }px`,
    "top": `${ offset.top }px`,
    "width": `${ innerWidth }px`,
    "height": `${ innerHeight }px`,
    "z-index": 2000000, //magic number
    "margin": 0,
    "padding": 0,
    "position": "absolute",
    "pointer-events": "none",
    "box-sizing": computed.getPropertyValue('box-sizing'),
    // you cant just get border-right etc due to FF support. thanks
    "border-right-width": computed.getPropertyValue('border-right-width'),		
    "border-left-width": computed.getPropertyValue('border-left-width'),		
    "border-top-width": computed.getPropertyValue('border-top-width'),		
    "border-bottom-width": computed.getPropertyValue('border-bottom-width'),				
    "border-right-style": computed.getPropertyValue('border-right-style'),		
    "border-left-style": computed.getPropertyValue('border-left-style'),		
    "border-top-style": computed.getPropertyValue('border-top-style'),		
    "border-bottom-style": computed.getPropertyValue('border-bottom-style'),				
    "transform": computed.getPropertyValue('transform'),		
    "transform-origin": computed.getPropertyValue('transform-origin'),	
    "border-color": config.borderColor
  };
  
  Object.assign(div.style, mainBoxStyles);
  
  // move to config
  div.classList.add('highlight');
  
  if (props.transition.duration) {
    animateHighlight(props.transition.duration);
  }

  if (props.animation.duration) {
    animateHighlight(props.animation.duration);
  }

  document.body.appendChild(div);
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
  
  let innerWidth = _getAsFloat('width');
  let innerHeight = _getAsFloat('height');
  let outerWidth = innerWidth;
  let outerHeight = innerHeight;
  
  // If border-box is not applied to the highlighted node,
  // add necessary properties
  if (!borderBox) {
    innerWidth += padding.left + padding.right;
    innerHeight += padding.top + padding.bottom;
    
    outerWidth = innerWidth + border.right + border.left;
    outerHeight = innerHeight + border.top + border.bottom;
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
    innerWidth: innerWidth,
    innerHeight: innerHeight,
    outerWidth: outerWidth,
    outerHeight: outerHeight,
    offset: offset,
    borderBox: borderBox,
    animation: animation,
    transition: transition,
    computed: computed
  };
  
  //reconsider returing computed (is it necessery really?);
};

let createElement = options => {
  let divEl = document.createElement('div');
  Object.assign(
    divEl.style, 
    options.styles
  );
  
  divEl.classList.add('highlight-element');
  
  return divEl;
};

let paddingRectStyling = (props, side) => { 
  let isHorizontal = ['left', 'right'];
  let width;
  let height;
  let left;
  let top;
  
  ({ 
    border, 
    padding,
    innerHeight,
    innerWidth,
    borderBox
  } = props);
  
  if (isHorizontal.indexOf(side) > -1) {
    width = padding[side];
    height = innerHeight - padding.bottom - padding.top;
    top = padding.top;
    
    if (borderBox) {
      height -= (border.top + border.bottom);
    }
  } else {
    height = padding[side];  
    width = innerWidth;
    left = 0;

    if (borderBox) {
      width -= (border.left + border.right);
    }
  }
  
  let obj = {
    width: `${ width }px`,
    height: `${ height }px`,
    left: (!left ? 'initial' : `${ left }px`),
    top: (!top ? 'initial' : `${ top }px`),
    position: `absolute`,
  };
  
  // Pull to the side of the padding
  obj[side] = 0;
  
  return obj;
};

let marginRectStyling = (props, side) => {
  let isHorizontal = ['left', 'right'];
  let width;
  let height;
  let left;
  let top;
  
  ({ 
    border, 
    outerHeight,
    outerWidth,
    margin
  } = props);
  

  if (isHorizontal.indexOf(side) > -1) {
    width = margin[side];
    height = outerHeight + margin.top + margin.bottom;
    top = - (margin.top + border.top);
  } else {
    height = margin[side];
    width = outerWidth;
    left = - border.left;
  }

  
  let obj = {
    width: `${ width }px`,
    height: `${ height }px`,
    left: (!left ? 'initial' : `${ left }px`),
    top: (!top ? 'initial' : `${ top }px`),
    position: `absolute`,
  };
  
  // position at the side which this margin represents
  // its calulated from upper left corner (?recheck)
  obj[side] = `${-(margin[side] + border[side])}px`;

  return obj;
};
          
// animation, later

// important one 

//            // Don't highlight elements with 0 width & height
//            if (elementBounds.width === 0 && elementBounds.height === 0) {
//                return;
//            }
            


  
document.body.addEventListener('click', ev => {
  hi = document.querySelector('.highlight');
  if (hi) 
    hi.parentNode.removeChild(hi);
  
  if (ev.target)
  createBoxModel({ node: ev.target });
});
// to translateX/Y