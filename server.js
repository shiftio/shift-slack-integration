const request     = require('request')
const crypto      = require('crypto');
 /**
  * The functions in this event handler will be invoked based on the name of the 
  * incoming event (see the readme for a list of all event). All events are named 
  * with the convention 'object.action'. If the name of the incoming event is 
  * 'asset.create' the on_asset_create function will be invoked. The function 
  * names should follow the convention 'on_object_action'. If the function does not 
  * exist then we will no op.
  * 
  * The example below impliments the on_asset_create function. However, you could create 
  * function for other events in the same way and they would be invoked when the respective 
  * event is triggered.
  */
const EventHandler = (function() {
  return {

    // Anytime we recieve an asset.create event we'll send a slack message to the preconfigured 
    // slack channel identified in the environment variable SLACK_WEBHOOK_URL
    on_asset_create: function(event, next) {
      request({
        method: 'POST',
        // Learn about slack message formats here: 
        // https://api.slack.com/docs/messages
        body: {
        "attachments": [
          {
              "color": "#36a64f",
              "author_name": `${event.user.firstName} ${event.user.lastName}`,
              "author_icon": `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(event.user.email.toLowerCase().trim()).digest("hex")}`,
              "title": "New Asset Created",
              "text": `A new ${event.entity.asset.type} ${event.entity.asset.title} was created in the project ${event.entity.project.name}`,
              "image_url": `${event.entity.asset.posterFrame}`,
              "thumb_url": `${event.entity.asset.posterFrame}`,
              "footer": "Shift API",
              "footer_icon": "https://shift.io/images/logo.svg"
          }
      ]},
        json: true,
        // This needs to be set in app.json for herokuy deployments. 
        // If you're running locally, you can set it as an environment 
        // variable as `export SLACK_WEBHOOK_URL=YOUR_SLACK_WEBHOOK_URL` 
        url: process.env.SLACK_WEBHOOK_URL
      }, function (err, response, body) {
        if (err) {
          res.sendStatus(500);
          console.error('error posting json: ', err)
          throw err
        }
        next()
      }) 
    }
  };
})();

/**
 * The following code handles the creation on the server which has a single 
 * route, /events, which handles incoming shift events
 */
const express     = require('express')
const server      = express()
const bodyParser  = require('body-parser')


server.use(bodyParser.json())

/**
 * We use jade for the "next steps" page that we show immediately after the 
 * heroku app is started. Otherwise you don't need this or the "next steps" route below
 */
server.set('views', __dirname + '/views')
server.set('view engine', 'jade')
server.use(express.static(__dirname + '/public'))

server.get('/next-steps', function (req, res) {
  res.render('next-steps', { SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL })
})


/**
 * Event Route
 * 
 * This route recieves incoming webhooks from shift
 */
server.post('/events', function (req, res) {
    var event = req.body;
    var eventHandlerFunctionName = 'on_' + event.eventName.replace('.', '_');

    if(event && event.eventName && EventHandler.hasOwnProperty(eventHandlerFunctionName)) {
      EventHandler[eventHandlerFunctionName](event, function() {
        res.sendStatus(200);
      })
    } else {
      res.sendStatus(200);
    }
  }
)

const port = process.env.PORT || 8080;
server.listen(port, () => console.log('Shift integration app running on port ' + port + '!'))

