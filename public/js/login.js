// Use baseURL so URL params don't affect behavior
var baseUrl = location.protocol + '//' + location.host + location.pathname;

$(document).ready(function() {
    /*
    User login form
    */
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
});