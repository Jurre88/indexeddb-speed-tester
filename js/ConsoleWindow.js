function ConsoleWindow()
{
    this.isVerboseCheckbox = jQuery('#is-verbose');
    this.isVerbose = this.isVerboseCheckbox.is(':checked');

    this.shouldScrollCheckbox = jQuery('#should-scroll');
    this.shouldScroll = this.shouldScrollCheckbox.is(':checked');

    this.writeLineToConsole(
        'App started in '+(this.isVerbose ? 'verbose' : 'regular')+' mode...'
    );

    var self = this;

    setInterval(function () {
        if (self.shouldScroll) {
            var element = document.getElementById('console');
            element.scrollTop = element.scrollHeight;
        }
    }, 100);

    jQuery('#console').on('click', function () {
        self.shouldScrollCheckbox.prop('checked', !self.shouldScrollCheckbox.is(':checked'));
        self.shouldScroll = self.shouldScrollCheckbox.is(':checked');
    });

    jQuery(document).on('change', '#should-scroll', function () {
        self.shouldScroll = self.shouldScrollCheckbox.is(':checked');

        if (self.shouldScroll) {
            self.writeLineToConsole('Enabled auto scroll');
        } else {
            self.writeLineToConsole('Disabled auto scroll');
        }
    });

    jQuery(document).on('change', '#is-verbose', function () {
        self.isVerbose = self.isVerboseCheckbox.is(':checked');

        if (self.isVerbose) {
            self.writeLineToConsole('Switched to verbose mode');
        } else {
            self.writeLineToConsole('Switched to regular mode');
        }
    });

    jQuery('#clear-console-window').on('click', function() {
        document.getElementById('console').innerHTML = '';
    });
}

ConsoleWindow.prototype = {
    isVerboseCheckbox: null,
    isVerbose: false,
    shouldScrollCheckbox: null,
    shouldScroll: true,

    /**
     * Writes a line to the inline console screen which we use to output
     * the results.
     *
     * @param {string} text
     * @param {string|null} [color]
     * @param {string} [type]
     */
    writeLineToConsole: function(text, color, type)
    {
        if (!color) {
            color = '#fff';
        }

        if (!type) {
            type = 'regular';
        }

        var textContainerElement = document.createElement('span');
        textContainerElement.style.color = color;
        textContainerElement.classList.add('message-row');
        textContainerElement.classList.add(type);

        var dateTimeTextContainerElement = document.createElement('span');
        dateTimeTextContainerElement.classList.add('datetime');
        dateTimeTextContainerElement.style.color = 'grey';
        var dateTimeTextNode = document.createTextNode(moment().format('YYYY-MM-DD HH:mm:ss') + ' - ');
        dateTimeTextContainerElement.append(dateTimeTextNode);
        textContainerElement.appendChild(dateTimeTextContainerElement);

        var textNode = document.createTextNode(text);
        textContainerElement.append(textNode);
        var newLine = document.createElement('br');
        textContainerElement.append(newLine);

        document.getElementById('console')
            .append(textContainerElement);
    }
}
