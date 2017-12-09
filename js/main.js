/*
store name of place
auto add new zealand
grab geolocation
handle if no coords
save doc into pouchdb
make sure pouchdb works from local site even if offline
sync pouchdb with cloudant if online
update view after insert
push repo up to my github
set up github pages, host site from there
load site into mobile browser
make sure pouchdb works from github site even if offline
*/

var list = {
  template: '#list',
  data: function(){
    return {
      name: '',
      items: [],
      searchStr: '',
      watching: 'off',
      loading: false
    }
  },
  created: function(){
    document.title = 'List';
    this.loading = true;
    this.start();
  },
  methods: {
    start: function(){
      _this = this;
      db.allDocs({include_docs: true, descending: true}, function(err, docs) {
        var mapped = function(data){
          return data.rows.map(function(row) {
            return row.doc; 
          });
        };
        _this.items = mapped(docs);
        _this.loading = false;
      });
    },
    markForDeletion: function(doc){
      if(doc._deleted){
        Vue.set(doc, '_deleted', false);
        delete doc._deleted;
      } else {
        Vue.set(doc, '_deleted', true);
      }
    },
    bulkDelete: function(){
      // grab all items that are marked deleted
      // var q = "SELECT * FROM locations WHERE '_deleted' = 'true'";
      // db.sql(q).then(console.log);      
      // pass to bulk
      _this = this;
      var putDocs = function(docs){
        db.bulkDocs(docs)
          .then(function (result) {
            _this.start();
          }).catch(function (err) {
            console.log(err);
          });
      };

      var array = [];
      for(var i=0; i < _this.items.length; i++){
        if(_this.items[i]._deleted){
//          console.log(this.items.length);
          array.push(_this.items[i]);
        }
      }
      console.log(array)
      putDocs(array);
    },

    geowatch: function(arg){
      _this = this;
      var id, target, options;
      
      _this.watching = arg;

      db.all({limit:1,'sort':'desc'}).then();

      function success(pos) {
        _this.loading = 'watching...'
        // is this update at least a minute old?
        // var q = "SELECT name, cost FROM animals WHERE collection = 'cats' ORDER BY name DESC LIMIT 50";
        // db.sql(q).then(console.log);
        // var q = "SELECT * from locations ORDER BY _id DESC LIMIT 1"
        // db.sql(q).then(console.log);
        _this.insert('watch');
      }
      
      function error(err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
        _this.loading = err.code;
      }
            
      options = {
        enableHighAccuracy: false, 
        maximumAge        : 7000, 
        timeout           : 5000
      };
      
      if(_this.watching == 'off'){
        navigator.geolocation.clearWatch(id);        
      } else {
        id = navigator.geolocation.watchPosition(success, error, options);        
      }

    },

    insert: function(arg){
      _this = this;
      _this.loading = "Loading...";
      var doc = getDocScaffold();

      doc.properties.name = (_this.name) ? _this.name.trim() + ', New Zealand' : '';

      if(arg == 'watch'){
        doc.watch = true;
      }

      var putDoc = function(doc){
        db.put(doc
        ).then(function (resp) {
          _this.start();
          _this.loading = false;
        }).catch(function (err) {
          console.log(err);
        });
      };
      var geo_options = {
        enableHighAccuracy: true, 
        maximumAge        : 30000, 
        timeout           : 27000
      };

      if ("geolocation" in navigator) {
        // console.log('geolocation is enabled')
        navigator.geolocation.getCurrentPosition(function(position) {
          doc.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
          // var long = doc.geometry.coordinates[0];
          console.log(position.coords.latitude, position.coords.longitude);
          /*          
          Bad Geo
          Long: -95.3698028
          Lat: 29.760426700000004
          */
          if( doc.geometry.coordinates[0] < 100 ){
            _this.loading = "Last geo attempt discarded: " + doc.geometry.coordinates.join(',');
          }
          else {
            putDoc(doc);
            _this.name = '';  
          }
        }, function(error){
          console.log(error);
          var errorCode = error.code;
          var errorString = (errorCode == 2) ? 'position unavailable' : error.message;
          _this.loading = "Last geo attempt: " +  errorString;
        }, geo_options);
      } else {
        console.log('Geolocation is not enabled.')
      };
    }       
  }
}

// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// `Vue.extend()`, or just a component options object.
// We'll talk about nested routes later.
const routes = [
  { path: '/list', component: list, alias: '/' }
]

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
  routes // short for `routes: routes`
});

Vue.component('household', {
  template: '<div> \
    <b>{{ item.label_name }}</b><br /> \
    {{ item.street1 }} {{ item.street2 }}<br /> \
    {{ item.city }} {{ item.state }} {{ item.zip }}<br /> \
    {{ item.phone }}<br /> \
    <b>Mail newsletter?</b> {{ item.mail_news }}<br /> \
    <b>Mail list?</b> {{ item.mail_list }}<br /> \
    </div>',
  props: ['item'],
  methods: {
    start: function(){
      console.log('hi')
    }
  }  
});

Vue.component('person', {
  template: '<li> \
    <b>{{ item.first }} {{ item.last }}</b> \
    <span v-if="item.status">({{ item.status }})</span> \
    <span v-if="item.dob"> | {{ item.dob }}</span> \
    <span v-if="item.email"> | {{ item.email }}</span> \
    <span v-if="item.phone"> | {{ item.phone }}</span> \
    <span v-if="item.work_phone"> | Work: {{ item.work_phone }}</span> \
    </li>',
  props: ['item']
})

var vm = new Vue({
  el: '#app',
  router
});

new Vue({
    el: 'title',
    data: {
        title: 'My Title'
    }
})
  // Initialize collapse button
  $(".button-collapse").sideNav({
      closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor    
  });
    // Initialize collapsible (uncomment the line below if you use the dropdown variation)
  //$('.collapsible').collapsible();