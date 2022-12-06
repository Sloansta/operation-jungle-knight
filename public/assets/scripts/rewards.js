console.log("loaded rewards page script file.")

fetch("/api/encounter/rewards", {
  method: "GET"
}).then(res => res.json())
.then(data => {
  console.log(data);
  let list = document.querySelector("#reward_items");
  for(const reward of data.items) {
    let item = document.createElement('li');
    let link = document.createElement('a');
    link.textContent = reward.name;
    link.dataset.itemid = reward.id;
    link.href = "/api/encounter/rewards/"+reward.id;
    link.setAttribute("id", "reward_choice");
    link.classList.add("option");
    item.appendChild(link);
    item.dataset.type = reward.type;
    list.appendChild(item);
  }
});

document.querySelector("#reward_items").addEventListener("click", (e) => {
  // console.log(e.target.href);
  if(e.target.href) {
    e.preventDefault();
    fetch(e.target.href, {
      method: "POST",
      body: {
        itemid: e.target.dataset.itemid
      }
    }).then(res => res.json())
    .then(data => {
      console.log(data);
      if(data.status == "success") {
        //redirect to encounter select screen
        window.location.href = "/run/server";
      } else {
        // popup error message, request new selection.
      }
    });
  }
})