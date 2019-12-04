angular.module('handyforall.tasks').controller('editTasksCtrl', editTasksCtrl);

editTasksCtrl.$inject = ['TasksEditReslove', 'TasksService', 'toastr', '$state', '$filter', '$scope', 'Lightbox'];

function editTasksCtrl(TasksEditReslove, TasksService, toastr, $state, $filter, $scope, Lightbox) {
    var edttc = this;
    edttc.editTasksData = TasksEditReslove[0];
     console.log('EDTTC.editTasksData/*/*/*/',edttc.editTasksData);
    if(edttc.editTasksData.billing_address) {
      var addressline1 = edttc.editTasksData.billing_address.line1;
      var myarr = addressline1.split(",");
      var addressone  = [];
      var addresstwo  = [];
      for(var i = 0 ; i < myarr.length ; i++){
        if(i== 0 || i == 1) {
          addressone.push(myarr[i]);
        } else {
          addresstwo.push(myarr[i]);
        }
      }
      edttc.addressone = addressone.toString();
      edttc.addresstwo = addresstwo.toString();
    }

    edttc.openLightboxModal = function (index, image) {
      Lightbox.openModal(image, index);
      };
  
    var useraddressline1 = edttc.editTasksData.tasker[0].address.line1; var umyarr       = useraddressline1.split(",");
    var uaddressone  = [];
    var uaddresstwo  = [];
    for(var i = 0 ; i < umyarr.length ; i++){
      if(i== 0 || i == 1) {
        uaddressone.push(umyarr[i]);
      } else {
        uaddresstwo.push(umyarr[i]);
      }
    }
    edttc.uaddressone = uaddressone.toString();
    edttc.uaddresstwo = uaddresstwo.toString();

    edttc.checkphoto = function submit(image) {
      var pdf = image.split('.').pop();
          if(pdf == 'pdf'){
			return true;
		  }
		  else{
			return false;
		  }
    }
    edttc.submit = function submit(isValid) {
        if (isValid) {
            TasksService.save(edttc.editTasksData).then(function (response) {
                toastr.success('Question Added Successfully');
                $state.go('app.tasks.viewsTasks');
            }, function (err) {
                toastr.error(err[0].msg);
            });
        } else {
            toastr.error('form is invalid');
        }
    };

   TasksService.getTransaction(edttc.editTasksData._id).then(function (response) {
      edttc.getTransaction = response;
   });
}
