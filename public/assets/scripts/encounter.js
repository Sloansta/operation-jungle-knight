console.log("loaded encounter page script.");

fetch("/api/encounter/data", {
  method: "GET"
}).then(res => res.json())
.then(data => {
  // console.log(data);
  let list = document.getElementById("enemy_list")
  for(const en of data.enemies) {
    let enemy = document.createElement('li');
    enemy.textContent = en.enemy_name;
    let sp = document.createElement("span");
    sp.textContent = " (" + en.current_health + "/" + en.max_health + ")";
    sp.classList.add("enemy_"+en.id);
    enemy.appendChild(sp);
    // enemy.dataset.id = data.enemies[i].id;
    list.appendChild(enemy);
  }
});

fetch("/api/player/stats", {
  method: "GET"
}).then(res => res.json())
.then(data => {
  // console.log("player data:")
  // console.log(data);
  let hp = document.getElementById("player_hp");
  hp.textContent = "("+data.current_hp+"/"+data.max_hp+")";
  hp.dataset.max = data.max_hp;
  document.getElementById("player_status").textContent = JSON.stringify(data.statuses);
  document.getElementById("player_def").textContent = data.current_defense;
  document.getElementById("player_conn").textContent = data.connection;
  document.getElementById("player_ob").textContent = data.obfuscation;
});

//can be fetched in parallel because they don't depend on each other.
fetch("/api/player/attacks", {
  method: "GET"
}).then(res => res.json())
.then(data => {
  // console.log(data);
  let list = document.getElementById("player_attacks")
  for(const skill of data.attacks) {
    let item = document.createElement('li');
    let atk = document.createElement('label');
    //atk.classList.add("action").add("attack");
    //atk.htmlFor =
    atk.textContent = skill.data.name;
    let sp = document.createElement("span");
    sp.textContent = " (CD: "+skill.cooldown+")";
    sp.classList.add("atk_"+skill.id);
    atk.appendChild(sp);
    //atk.dataset.str = data.attacks[i].data.str;
    let chk = document.createElement("input");
    chk.type = "checkbox";
    chk.value = skill.id;
    if(skill.cooldown != 0) {
      // console.log("on cooldown!")
      chk.disabled = true
    }
    atk.appendChild(chk);
    item.appendChild(atk);
    list.appendChild(item);
  }
});

//set up 'attack selection' handler
document.getElementById("player_attacks").addEventListener("click", (e) => {
  //e.preventDefault();
  //if the event target is a checkbox, then handle logic.
})

document.getElementById("submit_turn").addEventListener("click", (e) => {
  e.preventDefault();
  //on submit (attempt), check to make sure the player has not exceeded the maximum
  // number of actions (3 by default)
  let list = document.querySelectorAll("#player_attacks input:checked");
  if (list.length > 3) {
    //FIXME: These should be manually constructed modals. Javascript alerts and confirms are bad.
    alert("please select fewer than 3 actions");
  } else {
    //assume valid? or should there be a final condition here to make sure?
    let submissionData = {
      attacks: []
    }
    if (list.length <= 0) {
      //FIXME: These should be manually constructed modals. Javascript alerts and confirms are bad.
      if(!confirm("are you sure you don't want to take any actions this turn?")) {
        return;
      }
    } else {
      list.forEach((el, i) => {
        submissionData.attacks.push(el.value);
      });
    }
    // console.log("attempting to post submissiondata:");
    // console.log(submissionData);
    fetch("/api/encounter/turn",{
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    }).then(res => res.json())
    .then(data => {
      // console.log("turn submitted, got response from the server:");
      // console.log(data);
      handleTurnResults(data);
    });
  }
})

function handleTurnResults(api_data) {
  let thingsToAnimate = api_data.data.actions;
  let statusToUpdate = api_data.data.next_turn;
  if (api_data.data.victory) {
    //what do we do when the player wins?
    //display modal with victory message
    displayModal("You Win!")
    if(api_data.data.gameover) {
      // player has won the entire run
      document.querySelector(".modal .runcomplete").style.display = "block";
    } else {
      document.querySelector(".modal .victory").style.display = "block";
    }
  } else if (api_data.data.defeat) {
    //what do we do when the player loses?
  } else {
    if (api_data) {
      console.log(api_data.data.actions);
      let list = document.querySelectorAll("#player_attacks input:checked");
      for (const skill of list) {
        skill.checked = false;
      }
      //update player stats
      let playerobj = api_data.data.next_turn.player;
      let hp = document.getElementById("player_hp")
      hp.textContent = "("+playerobj.hp+"/"+hp.dataset.max+")";
      document.getElementById("player_status").textContent = JSON.stringify(playerobj.statuses);
      document.getElementById("player_def").textContent = playerobj.defense;
      document.getElementById("player_conn").textContent = playerobj.connection;
      document.getElementById("player_ob").textContent = playerobj.obfuscation;
      //update cooldowns
      for(const skill of playerobj.skills) {
        let id = skill.id;
        document.querySelector(".atk_"+id).textContent = " (CD: "+skill.cooldown+")";
        if (skill.cooldown == 0) {
          document.querySelector("input[value='"+id+"']").disabled = false
        } else {
          document.querySelector("input[value='"+id+"']").disabled = true
        }
      }
      for (const enemy of api_data.data.next_turn.enemies) {
        // console.log("update enemy data:")
        // console.log(enemy);
        document.querySelector(".enemy_"+enemy.id).textContent = " (" + enemy.current_health + "/" + enemy.max_health + ")"
      }
    }
  }
}