// CDR search
var get_mached_calls_details = function(found_calls, cdr_ids, indx, cdrs_details){
  if(indx == cdr_ids.length){
    return;
  }
  var cdr_id = cdr_ids[indx];
  $.ajax({type: "GET", headers: {"X-Auth-Token": (monster.apps.auth.authToken || monster.apps.auth.getAuthToken())}, dataType: 'json',
    success: function (data) {
      console.log("cdr summary: " + cdr_id);
      console.log(found_calls[cdr_id]);
      console.log("cdr detail: " + cdr_id);
      console.log(data.data);
      cdrs_details[cdr_id] = data.data
      get_mached_calls_details(found_calls, cdr_ids, (indx + 1), cdrs_details);
      //console.log("log search params:");
      //console.log(JSON.stringify(['call_id', 'other_leg_call_id', 'duration_seconds', 'node', 'media_server', 'timestamp' ].reduce(function(o, k) { o[k] = data.data[k]; return o; }, {})));
    },
    url: monster.apps.auth.apiUrl + "accounts/" + monster.apps.auth.accountId + "/cdrs/" + cdr_id,
    data: { "_": Date.now()}
  });
}
var cdr_search = function (s_opts, found_calls, start_key, search_cnt) {
  search_cnt++;
  console.log("searching page " + search_cnt);
  var opts = {
    created_from: s_opts.tm_from,
    created_to: s_opts.tm_to,
    page_size: s_opts.page_size
  };
  if (start_key != ""){
    opts["start_key"] = start_key;
  }
  opts["_"] = Date.now();
  $.ajax({type: "GET", headers: {"X-Auth-Token": (monster.apps.auth.authToken || monster.apps.auth.getAuthToken())}, dataType: 'json',
    success: function (data) {
      var cdr_list = data;
      var l = cdr_list.data.length;
      //console.log(cdr_list.next_start_key);
      //console.log(cdr_list);
      for (var i = 0; i < l; ++i) {
        if (
          (s_opts.call_id && 
            (s_opts.call_id.exec(cdr_list.data[i].call_id)
             || (cdr_list.data[i].other_leg_call_id 
                 && s_opts.call_id.exec(cdr_list.data[i].other_leg_call_id))))
         || (s_opts.num && (s_opts.num.exec(cdr_list.data[i].callee_id_number) || s_opts.num.exec(cdr_list.data[i].caller_id_number)))){
          console.log("found match at index " + i + " call id: " + cdr_list.data[i].call_id);
          found_calls[cdr_list.data[i].id] = cdr_list.data[i];
        }
      }
      if (l > 0 && search_cnt < s_opts.max_pages && cdr_list.next_start_key) {
        cdr_search(s_opts, found_calls, cdr_list.next_start_key, search_cnt);
      } else {
        console.log("Finished searching, pages searched: " + search_cnt);
        get_mached_calls_details(found_calls, Object.keys(found_calls), 0, {});
      }
      //console.log(data.data)
    },
    url: monster.apps.auth.apiUrl + "accounts/" + monster.apps.auth.accountId + "/cdrs",
//    url: monster.apps.auth.apiUrl + "accounts/" + monster.apps.auth.accountId + "/cdrs/interaction",
    data: opts
  });
}

// edit search options. Delete call_id or num line if not searching by them.
var cdr_list,
  search_opts = {
    //call_id: new RegExp("99583d36-91d9-4cb0-b258-32164dfe1b63"),
  num: new RegExp("5551234567"),
  tm_from: Date.parse("2016-10-12 13:37:59 UTC")/1000 + 62167219200,
  tm_to: Date.parse("2016-10-12 19:37:59 UTC")/1000 + 62167219200,
  page_size: 1000,
  max_pages: 10
  };
  
cdr_search(search_opts, {}, "", 0);
