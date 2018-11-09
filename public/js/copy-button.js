$(document).ready(function() {
    /*
    Copies the URL to user's clipboard 
    https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
    */
    $('#copy').click(function(event) {
        var el = document.createElement('textarea');
        el.value = window.location.href;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    });
});