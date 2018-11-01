var baseUrl = location.protocol + '//' + location.host + location.pathname;

$(document).ready(function() {
    $('#login-form').submit(function(event) {
        event.preventDefault();
        $.ajax({
            type: 'POST',
            url: baseUrl + '/login',
            data: {
                username: $(this).find('input[name="username"]').val(),
                password: $(this).find('input[name="password"]').val(),
            },
            success: function() {
                location.reload(); // redirects to poll
            },
            error: function(message) {
                alert(message.responseText);
            }
        });
        return false;
    });

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