


const deleted = (id) => {
    swal({
        title: "Apakah anda yakin?",
        text: "data product ini akan di hapus secara permanen dengan data transaksi!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        if (willDelete) {
           window.location.href = '/product/deleted/'.concat(id)
        }
      });
}
const deletedUser = (id) => {
  swal({
      title: "Apakah anda yakin?",
      text: "data custumers ini akan di hapus secara permanen!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
         window.location.href = '/custumer/delete/'.concat(id)
      }
    });
}
const detail = (params) => {
  $.ajax({
    type: "get",
    url: "/product/getdata/".concat(params),
    dataType: "json",
      success: function (response) {
      $('#description').val(response.description);
      $('#image_product').attr("src", "/images/".concat(response.img))
    }
  });
}