$(document).ready(function() {
    $('#login-form').submit(function(event) {
        event.preventDefault();
        $.ajax({
            type: 'POST',
            url: window.location.href + '/login',
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
});