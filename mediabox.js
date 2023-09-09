/* MediaBox */

/**
 * MediaBox Class
 * This class constructs a mediabox from a link element or any other element with a 'data-url' attribute.
 * 
 * @constructor
 * @param {HTMLElement} elem - The HTML element that triggers the mediabox.
 */
let MediaBox = function(elem) {
    // Initialize the class variables and DOM manipulations, if not already done.
    if (!MediaBox.isInit) {
        MediaBox.init();
        MediaBox.isInit = true;
    }

    // Set up instance variables
    this.trigger = elem;
    this.href = elem.getAttribute('href') || elem.dataset.url || null;

    // New responsive logic
    if (window.innerWidth < 1000) {
        this.width = window.innerWidth * 0.9; // 90% of screen width
        // set the height dynamically based on width if you need to
    } else {
        // Existing dimension logic, if needed
        const windowWidth = window.innerWidth;
        const maxWidth = Math.min(windowWidth, 1400);
        this.width = maxWidth;

        // Set height to 800px only when width is 1400px
        if (this.width === 1400) {
            this.height = 800;
        } else {
            // set height based on aspect ratio or some other logic
            this.height = this.width * (600 / 1000);
        }
    }


    // Determine whether to close with overlay
    const closeWithOverlayData = elem.dataset.closeWithOverlay || 1;
    this.closeWithOverlay = !['0', 'false'].includes(closeWithOverlayData);

    // Determine whether to show the close button
    const showBtnCloseData = elem.dataset.showBtnClose || 1;
    this.showBtnClose = !['0', 'false'].includes(showBtnCloseData);

    // Check if the href exists; if so, add a click event listener
    if (this.href) {
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.open();
        });
    } else {
        // Log an error if there is no URL information in the element
        console.error('[MediaBox] This element does not contain URL information');
    }

    // Set the current instance
    MediaBox.current = this;
};

/**
 * Initialize MediaBox
 */
MediaBox.init = function() {
    // Create and Configure DOM Elements
    ['div', 'div', 'div', 'div', 'div', 'div', 'iframe'].forEach((tag, i) => {
        MediaBox[['el', 'content', 'body', 'spinner', 'overlay', 'closebtn', 'frame'][i]] = document.createElement(tag);
    });
    MediaBox.frame.setAttribute('allowfullscreen', '');
    MediaBox.closebtn.innerHTML = '<i class="fa fa-times-circle-o" aria-hidden="true"></i>';
    ['mediabox', 'mbox-overlay', 'mbox-spinner', 'mbox-content', 'mbox-close', 'mbox-body'].forEach((cls, i) => {
        MediaBox[['el', 'overlay', 'spinner', 'content', 'closebtn', 'body'][i]].classList.add(cls);
    });

    // Assemble the DOM elements
    MediaBox.el.append(this.overlay, this.closebtn, this.spinner, this.content);
    MediaBox.content.appendChild(this.body);
    MediaBox.body.append(this.frame);
    document.body.appendChild(this.el);

    // Frame Load Event
    MediaBox.frame.onload = () => {
        if (!MediaBox.isOpen()) return;

        // Toggle Visibility
        MediaBox.spinner.classList.remove('mbox-show');
        MediaBox.content.classList.add('mbox-loaded');

        // Show Close Button If Configured
        if (MediaBox.current.showBtnClose) {
            MediaBox.closebtn.classList.add('mbox-show', 'mbox-open');
        }

        const removeCloseButton = () => {
            MediaBox.closebtn.classList.remove('mbox-show');
            ['webkitAnimationEnd', 'mozAnimationEnd', 'msAnimationEnd', 'animationend'].forEach(event => {
                MediaBox.closebtn.removeEventListener(event, removeCloseButton, false);
            });
        };
        ['webkitAnimationEnd', 'mozAnimationEnd', 'msAnimationEnd', 'animationend'].forEach(event => {
            MediaBox.closebtn.addEventListener(event, removeCloseButton, false);
        });
    };

    // Close Events
    const closeWithOverlay = () => { if (MediaBox.current.closeWithOverlay) MediaBox.close(); };
    const closeWithBtn = () => { MediaBox.close(); };
    MediaBox.overlay.addEventListener('click', closeWithOverlay);
    MediaBox.closebtn.addEventListener('click', closeWithBtn);

    // Resetting Lightbox
    const resetLightbox = () => {
        if (MediaBox.isOpen()) return;
        MediaBox.frame.src = 'about:blank';
        MediaBox.el.classList.remove('mbox-show');
        MediaBox.closebtn.classList.remove('mbox-show', 'mbox-open');
    };
    ['transitionend', 'webkitTransitionEnd', 'mozTransitionEnd', 'msTransitionEnd'].forEach(event => {
        this.el.addEventListener(event, resetLightbox, false);
    });

    // Message Listener for Closing Lightbox
    window.addEventListener("message", (event) => {
        if (event.data === "mediabox-close-me") MediaBox.close();
    }, false);
};

/**
 * Load the given URL into the iframe and manage visibility of elements
 * @param {string} href - The URL to load into the iframe
 */
MediaBox.loadIframe = function(href) {
    // Show spinner, hide content and close button
    MediaBox.spinner.classList.add('mbox-show');
    ['mbox-loaded', 'mbox-show', 'mbox-open'].forEach(cls => {
        MediaBox[['content', 'closebtn', 'closebtn'][['mbox-loaded', 'mbox-show', 'mbox-open'].indexOf(cls)]].classList.remove(cls);
    });

    // Load the given URL into the iframe
    MediaBox.frame.src = href;
};

/**
 * Open the mediabox with specified dimensions and URL
 */
MediaBox.prototype.open = function() {
    // Set the iframe dimensions
    MediaBox.setDimensions(this.width, this.height);

    // Start loading the URL into the iframe
    MediaBox.loadIframe(this.href);

    // Display the mediabox parent element
    MediaBox.el.classList.add('mbox-show');

    // Trigger reflow to ensure CSS transitions work as expected
    // This is necessary for transitions to take effect
    MediaBox.el.offsetHeight;

    // Add 'mbox-open' to kick off CSS transitions
    MediaBox.el.classList.add('mbox-open');

    // Update the class of the overlay to control its click behavior
    const overlayClassAction = this.closeWithOverlay ? 'add' : 'remove';
    MediaBox.overlay.classList[overlayClassAction]('mbox-clickable');

    // Store the current MediaBox instance for reference
    MediaBox.current = this;
};

/**
 * Close the currently open mediabox
 */
MediaBox.close = function() {
    // Trigger the CSS transition to hide the mediabox parent element
    MediaBox.el.classList.remove('mbox-open');
};

/**
 * Check if the mediabox is currently open
 * @return {boolean} True if mediabox is open, otherwise false
 */
MediaBox.isOpen = function() {
    return MediaBox.el.classList.contains('mbox-open');
};

/**
 * Set the width of the content container
 * @param {number} w - Width in pixels
 * @param {number} h - Height in pixels
  */
MediaBox.setDimensions = function(w,h) {
    MediaBox.content.style.width = `${w}px`;
    MediaBox.content.style.height = `${h}px`;
};

/**
 * Initialize mediabox elements on DOMContentLoaded event
 * Transforms elements with the 'mediabox-link' class into MediaBox elements
 */
document.addEventListener("DOMContentLoaded", () => {
    const mediaboxLinks = document.querySelectorAll('.mediabox-link');
    mediaboxLinks.forEach((el) => {
        el.mediabox = new MediaBox(el);
    });
});