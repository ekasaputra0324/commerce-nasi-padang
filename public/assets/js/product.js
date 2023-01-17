const deleted = () => {
    swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this imaginary file!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        if (willDelete) {
          swal("Poof! Your imaginary file has been deleted!", {
            icon: "success",
        });
        } else {
          swal("Your imaginary file is safe!");
        }
      });
}
const detail = (params) => {
  $.ajax({
    type: "get",
    url: "/product/getdata/".concat(params),
    dataType: "json",
    success: function (response) {
      let data = JSON.stringify(response.description);
      console.log(data);
     const p =  $('#paragraf').text(response.description);
     console.log(p);
    }
  });
}