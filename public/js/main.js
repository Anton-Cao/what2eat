var limit = 6;

var deleteChoice = function(e) { // runs when delete button is clicked
    e.preventDefault();
    // if currently at max number of choices, toggle disable on button
    if ($('#food-choices')[0].childElementCount === limit) {
        $('#add-food').toggleClass('disabled');
    }
    this.parentNode.parentNode.remove(); // remove the input field

    // might have to relabel the Options
    var options = Array.from($('#food-choices')[0].childNodes);
    for (i in options) {
        var label = options[i].firstChild;
        label.innerText = `Option #${parseInt(i) + 1}`;
    }
}

$(document).ready(function() {
    $('#add-food').click(function(e) {
        e.preventDefault();
        var foodChoices = $('#food-choices')[0];
        var numFoods = foodChoices.childElementCount;
        if (numFoods < limit) {
            var newFoodChoice = document.createElement('div');
            newFoodChoice.classList = 'field';
            var wrapper = document.createElement('div');
            wrapper.classList = 'ui action input';
            var label = document.createElement('label');
            label.innerText = `Option #${numFoods + 1}`; 
            var input = document.createElement('input');
            input.type = 'text';
            input.name = 'foodChoice';
            input.value = '';
            var button = document.createElement('button');
            button.classList = 'ui icon button';
            button.innerHTML = '<i class="close icon"></i>';
            button.onclick = deleteChoice;
            wrapper.appendChild(input);
            wrapper.appendChild(button);
            newFoodChoice.appendChild(label);
            newFoodChoice.appendChild(wrapper);
            foodChoices.appendChild(newFoodChoice);
        }
        if (numFoods + 1 == limit) {
            $('#add-food').toggleClass('disabled');
        }
    });
    $('#new-poll').submit(function(e) {
        if ($('#poll-name').val().length < 2) { // has to be at least two options
            e.preventDefault();
            $('#poll-name').parent().addClass('error');
        }  
    });
});