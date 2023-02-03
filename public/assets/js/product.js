


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
      text: "data custumers ini akan di hapus secara permanen berserta riwayat transaksi!",
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

const deletedTransaction = (id) => {
  swal({
      title: "Apakah anda yakin?",
      text: "data transaction ini akan di hapus secara permanen!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
         window.location.href = '/transaction/delete/'.concat(id)
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


const status = (id) => {
  swal({
    title: "Apakah anda yakin?",
    text: "pastikan makanan dan pembayaran sudah selesai",
    icon: "info",
    buttons: true,
    // dangerMode: true,
  })
  .then((willDelete) => {
    if (willDelete) {
       window.location.href = '/transaction/status/making/'.concat(id)
    }
  });
}

const getData = (id) => {
  $.ajax({
    type: "get",
    url: "/custemer/getdata/".concat(id), 
    dataType: "json",
      success: function (response) {
        console.log(response.saldo);
      $('#id').val(response.id);
      $('#saldo').val(response.saldo);
      // $('#image_product').attr("src", "/images/".concat(response.img))
    }
  });
}